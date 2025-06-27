import { config } from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import cron from "node-cron";
import OpenAI from "openai";

config(); // lädt .env-Werte

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const CHANNEL_NAME = process.env.DISCORD_CHANNEL_NAME || "allgemein";

// Function to send the motivational message
async function sendMotivationalMessage() {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) throw new Error("Kein Server gefunden.");
    const channel = guild.channels.cache.find(
      (c: any) => c.name === CHANNEL_NAME && c.isTextBased(),
    );
    if (!channel?.isTextBased())
      throw new Error("Textchannel nicht gefunden.");

    let message: string;
    
    // Try OpenAI first, fallback to pre-written messages if quota exceeded
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Du bist Lucy, eine empathische Begleiterin, die täglich liebevolle Impulse sendet.",
          },
          {
            role: "user",
            content: "Gib mir bitte einen achtsamen Impuls für den Tag.",
          },
        ],
      });
      message = response.choices[0].message.content || "Habe einen wundervollen Tag! ✨";
    } catch (openaiError: any) {
      // Fallback messages when OpenAI quota is exceeded
      const fallbackMessages = [
        "Jeder neue Tag ist eine Chance, das Leben mit mehr Liebe und Achtsamkeit zu leben. ✨",
        "Vergiss nicht, dass du bereits alles in dir trägst, was du für einen erfüllten Tag brauchst. 💫",
        "Heute ist ein perfekter Tag, um dir selbst mit Freundlichkeit zu begegnen. 🌸",
        "Lass dich von der Schönheit der kleinen Momente inspirieren. 🌼",
        "Du bist genau da, wo du sein sollst. Vertraue dem Prozess des Lebens. 🌱"
      ];
      message = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
      console.log("Using fallback message due to OpenAI quota:", openaiError.message);
    }

    await (channel as any).send(
      `🌞 Guten Morgen Patrick!\n\n**${message}** ❤️💚`,
    );
    console.log("Discord message sent successfully");
  } catch (err) {
    console.error("Fehler beim Senden:", err);
    throw err;
  }
}

// Export function for manual triggering
export async function triggerLucyBot() {
  if (!client.isReady()) {
    throw new Error("Discord bot is not ready yet");
  }
  await sendMotivationalMessage();
}

client.once("ready", () => {
  console.log(`LucyBot online als ${client.user?.tag}`);

  // Schedule daily messages at 9 AM Berlin time
  cron.schedule(
    "0 9 * * *",
    sendMotivationalMessage,
    {
      timezone: "Europe/Berlin",
    },
  );
});

client.login(process.env.DISCORD_BOT_TOKEN);
