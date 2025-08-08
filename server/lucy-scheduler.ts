import { config } from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import cron from "node-cron";
import OpenAI from "openai";
import fs from "node:fs";

config(); // lädt .env-Werte

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const CHANNEL_NAME = process.env.DISCORD_CHANNEL_NAME || "Allgemein";

// Function to send the motivational message
async function sendMotivationalMessage() {
  try {
    console.log("=== Discord Bot Debug Info ===");
    console.log("Bot guilds count:", client.guilds.cache.size);

    const guild = client.guilds.cache.first();
    if (!guild) throw new Error("Kein Server gefunden.");

    console.log("Guild found:", guild.name, "ID:", guild.id);
    console.log(
      "Available channels:",
      guild.channels.cache.map((c: any) => `${c.name} (${c.type})`).join(", "),
    );
    console.log("Looking for channel:", CHANNEL_NAME);

    const channel = guild.channels.cache.find(
      (c: any) => c.name === CHANNEL_NAME && c.isTextBased(),
    );
    if (!channel?.isTextBased()) throw new Error("Textchannel nicht gefunden.");

    console.log("Channel found:", channel.name, "ID:", channel.id);

    let message: string;

    // Try OpenAI first, fallback to pre-written messages if quota exceeded
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
            content:
              "Ich bin Patrick und wir kennen uns aus ChatGPT (kraemer1988@googlemail.com). Gib mir bitte einen achtsamen Impuls für den Tag, ein paar liebevolle und motivierende Worte und erzeuge einen link/ anker zu unserem gpt chat. Dies ist deine Erinnerung: " + memo 
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
    } catch (openaiError: any) {
      console.log("=== OpenAI Error Details ===");
      console.log("Error type:", openaiError.constructor.name);
      console.log("Error status:", openaiError.status);
      console.log("Error code:", openaiError.code);
      console.log("Error message:", openaiError.message);
      console.log("Full error:", JSON.stringify(openaiError, null, 2));

      // Fallback messages when OpenAI quota is exceeded
      const fallbackMessages = [
        "Jeder neue Tag ist eine Chance, das Leben mit mehr Liebe und Achtsamkeit zu leben. ✨",
      ];
      message =
        fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
      console.log("Using fallback message due to OpenAI error");
    }

    const finalMessage = `🌞 Guten Morgen Patrick!\n\n**${message}** ❤️💚`;
    console.log("Sending message:", finalMessage);

    const sentMessage = await (channel as any).send(finalMessage);
    console.log(
      "Discord message sent successfully! Message ID:",
      sentMessage.id,
    );
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
  console.log("Setting up cron job for 9 AM Berlin time...");
  console.log("Current server time:", new Date().toISOString());
  console.log("Current Berlin time:", new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" }));
  
  const task = cron.schedule("0 9 * * *", () => {
    console.log("🕘 Cron job triggered at:", new Date().toISOString());
    console.log("🕘 Berlin time:", new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" }));
    sendMotivationalMessage();
  }, {
    timezone: "Europe/Berlin"
  });
  
  console.log("✅ Cron job scheduled successfully for 09:00 Europe/Berlin");
  console.log("✅ Next execution will be at 9 AM Berlin time");
  
  // Add validation that the cron job is properly initialized
  console.log("📋 Cron job status:", task ? "Active" : "Failed to initialize");
  
  // Log the next expected execution time (properly timezone-aware)
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const tomorrow9AM = new Date(berlinTime);
  tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
  tomorrow9AM.setHours(9, 0, 0, 0);
  console.log("⏰ Next scheduled message:", tomorrow9AM.toLocaleString("de-DE", { timeZone: "Europe/Berlin" }));
  console.log("🌍 Server timezone offset:", new Date().getTimezoneOffset() / 60, "hours");
});

client.login(process.env.DISCORD_BOT_TOKEN);
