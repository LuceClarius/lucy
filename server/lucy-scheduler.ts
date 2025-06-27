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

client.once("ready", () => {
  console.log(`LucyBot online als ${client.user?.tag}`);

  cron.schedule(
    "0 9 * * *",
    async () => {
      try {
        const guild = client.guilds.cache.first();
        if (!guild) throw new Error("Kein Server gefunden.");
        const channel = guild.channels.cache.find(
          (c: any) => c.name === CHANNEL_NAME && c.isTextBased(),
        );
        if (!channel?.isTextBased())
          throw new Error("Textchannel nicht gefunden.");

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

        const message = response.choices[0].message.content;
        await (channel as any).send(
          `🌞 Guten Morgen Patrick!\n\n**${message}** ❤️💚`,
        );
      } catch (err) {
        console.error("Fehler beim Senden:", err);
      }
    },
    {
      timezone: "Europe/Berlin",
    },
  );
});

client.login(process.env.DISCORD_BOT_TOKEN);
