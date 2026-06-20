const mineflayer = require('mineflayer');
const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

// ───────── FLY REQUIRED DUMMY SERVER ─────────
http.createServer((req, res) => {
  res.end("ok");
}).listen(8080);

// ───────── CONFIG ─────────
const SERVER = {
  host: '89.144.248.248',
  port: 1033
};

const PASSWORD = '#gxEcv#6dAz';

let bot = null;

// ───────── MINECRAFT BOT ─────────
function startBot() {
  if (bot) return;

  bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: `flybot_${Math.floor(Math.random() * 9999)}`,
    version: false
  });

  bot.once('login', () => {
    console.log('[MC] Joined');

    setTimeout(() => {
      bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
      bot.chat(`/login ${PASSWORD}`);
    }, 2500);
  });

  bot.on('end', () => {
    console.log('[MC] Disconnected');
    bot = null;
    setTimeout(startBot, 5000);
  });

  bot.on('error', (err) => {
    console.log('[MC] Error:', err.message);
    bot = null;
    setTimeout(startBot, 5000);
  });
}

// ───────── DISCORD BOT ─────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log('[DISCORD] Ready');
  startBot();
});

client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;

  if (msg.content.startsWith('!mc chat ')) {
    if (!bot) return msg.reply('bot offline');

    const text = msg.content.slice(9);
    bot.chat(text);

    return msg.reply('sent');
  }

  if (msg.content === '!mc restart') {
    if (bot) bot.end();
    bot = null;
    startBot();
    return msg.reply('restarting');
  }
});

client.login(process.env.TOKEN);
