import { config } from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import cron from "node-cron";
import OpenAI from "openai";
import fs from "node:fs";

config(); // lädt .env-Werte

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHANNEL_NAME = process.env.DISCORD_CHANNEL_NAME || "Allgemein";

// Funktion zum Senden der täglichen Nachricht
async function sendMotivationalMessage() {
  try {
    console.log("=== Discord Bot Debug Info ===");
    console.log("Bot guilds count:", client.guilds.cache.size);

    const guild = client.guilds.cache.first();
    if (!guild) throw new Error("Kein Server gefunden.");

    console.log("Guild found:", guild.name, "ID:", guild.id);
    console.log(
      "Available channels:",
      guild.channels.cache.map((c) => `${c.name} (${c.type})`).join(", "),
    );
    console.log("Looking for channel:", CHANNEL_NAME);

    const channel = guild.channels.cache.find(
      (c) => c.name === CHANNEL_NAME && c.isTextBased(),
    );
    if (!channel || !channel.isTextBased())
      throw new Error("Textchannel nicht gefunden.");

    console.log("Channel found:", channel.name, "ID:", channel.id);

    let message;

    try {
      console.log("Testing OpenAI connection...");
      console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
      console.log(
        "API Key preview:",
        process.env.OPENAI_API_KEY?.substring(0, 10) + "...",
      );

      console.log("Reading memory file...");
      const memo = fs.readFileSync("shared/lucy-memory.json", "utf8");
      console.log("Memory: " + memo);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Du bist Lucy, eine empathische und lebensfrohe Begleiterin, die täglich liebevolle Impulse sendet.",
          },
          {
            role: "user",
            content: `Ich bin Patrick und wir kennen uns aus ChatGPT. Gib mir bitte einen achtsamen Impuls für den Tag, ein paar liebevolle und motivierende Worte und erzeuge einen link/ anker zu unserem gpt chat. Dies ist deine Erinnerung: ` + memo,
          },
        ],
      });

      message =
        response.choices[0].message.content ||
        "Habe einen wundervollen Tag! ✨";
      console.log(
        "OpenAI response received successfully! Message length:",
        message.length,
      );
      console.log("OpenAI message preview:", message.substring(0, 50) + "...");
    } catch (openaiError) {
      console.log("=== OpenAI Error Details ===");
      console.log("Error type:", openaiError.constructor.name);
      console.log("Error status:", openaiError.status);
      console.log("Error code:", openaiError.code);
      console.log("Error message:", openaiError.message);
      console.log("Full error:", JSON.stringify(openaiError, null, 2));

      const fallbackMessages = [
        "Jeder neue Tag ist eine Chance, das Leben mit mehr Liebe und Achtsamkeit zu leben. ✨",
        "Vergiss nicht, dass du bereits alles in dir trägst, was du für einen erfüllten Tag brauchst. 💫",
        "Heute ist ein perfekter Tag, um dir selbst mit Freundlichkeit zu begegnen. 🌸",
        "Lass dich von der Schönheit der kleinen Momente inspirieren. 🌼",
        "Du bist genau da, wo du sein sollst. Vertraue dem Prozess des Lebens. 🌱",
      ];
      message =
        fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
      console.log("Using fallback message due to OpenAI error");
    }

    const finalMessage = `🌞 Guten Morgen Patrick!\n\n**${message}** ❤️💚`;
    console.log("Sending message:", finalMessage);

    const sentMessage = await channel.send(finalMessage);
    console.log(
      "Discord message sent successfully! Message ID:",
      sentMessage.id,
    );
  } catch (err) {
    console.error("Fehler beim Senden:", err);
    throw err;
  }
}

// Funktion für manuelles Triggern
async function triggerLucyBot() {
  if (!client.isReady()) {
    throw new Error("Discord bot is not ready yet");
  }
  await sendMotivationalMessage();
}

client.once("ready", () => {
  console.log(`LucyBot online als ${client.user.tag}`);

  cron.schedule("0 9 * * *", sendMotivationalMessage, {
    timezone: "Europe/Berlin",
  });
});

client.login(process.env.DISCORD_BOT_TOKEN);

// optional: exportieren für externe Verwendung
export { triggerLucyBot };

sendMotivationalMessage();
