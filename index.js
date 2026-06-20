const mineflayer = require('mineflayer');
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const SERVER = {
  host: '89.144.32.248',
  port: 1033
};

let bot = null;

// ───────── BOT START ─────────
function startBot() {
  if (bot) return;

  bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: `rentacraft_${Math.floor(Math.random() * 9999)}`,

    // IMPORTANT FIX FOR VIA / 1.21 SERVERS
    version: false
  });

  bot.on('login', () => {
    console.log('Bot joined');

    setTimeout(() => {
      try {
        bot.chat('/register #gxEcv#6dAz #gxEcv#6dAz');
        bot.chat('/login #gxEcv#6dAz');
      } catch {}
    }, 3000);
  });

  bot.on('chat', (username, message) => {
    const channel = client.channels.cache.find(c => c.name === 'mc-chat');
    if (channel) channel.send(`**${username}:** ${message}`);
  });

  bot.on('end', () => {
    console.log('Bot disconnected');
    bot = null;
  });

  bot.on('error', (err) => {
    console.log('Bot error:', err.message);
    bot = null;
  });
}

// ───────── DISCORD ─────────
client.once('ready', () => {
  console.log('Discord bot ready');
});

client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;

  if (msg.content === '!mc start') {
    startBot();
    msg.reply('started');
  }

  if (msg.content.startsWith('!mc chat ')) {
    if (!bot) return msg.reply('bot offline');

    bot.chat(msg.content.slice(9));
    msg.reply('sent');
  }

  if (msg.content === '!mc stop') {
    if (!bot) return;

    bot.end();
    bot = null;
    msg.reply('stopped');
  }
});

client.login(process.env.TOKEN);
