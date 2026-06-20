const mineflayer = require("mineflayer");
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("MC BOT PANEL ONLINE"));
app.listen(process.env.PORT || 8080);

const SERVER = {
  host: "89.144.248.248",
  port: 1033
};

let bot = null;

function startBot() {
  if (bot) return;

  console.log("Starting Minecraft bot...");

  bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: `rentacraft_${Math.floor(Math.random() * 9999)}`,
    version: "1.21.5"
  });

  bot.on("login", () => console.log("LOGIN"));
  bot.on("spawn", () => console.log("SPAWN"));

  bot.on("kicked", (r) => {
    console.log("KICKED:", r);
    bot = null;
    setTimeout(startBot, 5000);
  });

  bot.on("end", () => {
    console.log("DISCONNECTED");
    bot = null;
    setTimeout(startBot, 5000);
  });

  bot.on("error", (e) => {
    console.log("ERROR:", e.message);
  });

  bot.on("chat", (u, m) => {
    console.log(`<${u}> ${m}`);
  });
}

// ───────── DISCORD ─────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log("Discord ready");
});

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  if (msg.content === "!start") {
    startBot();
    msg.reply("starting bot");
  }

  if (msg.content === "!stop") {
    if (bot) bot.end();
    bot = null;
    msg.reply("stopped");
  }

  if (msg.content.startsWith("!chat ")) {
    if (!bot) return msg.reply("bot offline");
    bot.chat(msg.content.slice(6));
  }

  if (msg.content === "!status") {
    msg.reply(bot ? "online" : "offline");
  }
});

client.login(process.env.TOKEN);
