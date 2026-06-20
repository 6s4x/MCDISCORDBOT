const mineflayer = require("mineflayer");
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

// ─────────────────────────────
// FLY REQUIRED HTTP SERVER
// ─────────────────────────────
const app = express();
app.get("/", (req, res) => res.send("OK"));
app.listen(process.env.PORT || 8080, () => {
  console.log("HTTP server running");
});

// ─────────────────────────────
// CONFIG
// ─────────────────────────────
const SERVER = {
  host: "89.144.248.248",
  port: 1033
};

const PASSWORD = "#gxEcv#6dAz";

let bot = null;

// ─────────────────────────────
// MINECRAFT BOT
// ─────────────────────────────
function startBot() {
  if (bot) return;

  console.log("Starting Minecraft bot...");

  bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: `flybot_${Math.floor(Math.random() * 9999)}`,
    version: false
  });

  bot.once("spawn", () => {
    console.log("MC bot spawned");

    setTimeout(() => {
      try {
        bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
        bot.chat(`/login ${PASSWORD}`);
      } catch (e) {
        console.log("Auth error:", e.message);
      }
    }, 3000);
  });

  bot.on("chat", (username, message) => {
    const channel = client.channels.cache.find(c => c.name === "mc-chat");
    if (channel) {
      channel.send(`**${username}:** ${message}`);
    }
  });

  bot.on("end", () => {
    console.log("MC bot disconnected");
    bot = null;

    setTimeout(startBot, 5000);
  });

  bot.on("error", (err) => {
    console.log("MC bot error:", err.message);
  });
}

// ─────────────────────────────
// DISCORD BOT
// ─────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Discord logged in as ${client.user.tag}`);

  startBot();
});

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  // send chat to MC
  if (msg.content.startsWith("!mc chat ")) {
    if (!bot) return msg.reply("bot offline");

    const text = msg.content.slice(9);
    bot.chat(text);

    return msg.reply("sent");
  }

  // restart bot
  if (msg.content === "!mc restart") {
    if (bot) bot.end();
    bot = null;

    startBot();

    return msg.reply("restarting bot");
  }
});

client.login(process.env.TOKEN);
