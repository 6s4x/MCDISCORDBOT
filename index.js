const mineflayer = require('mineflayer');
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const bots = [];
const MAX_BOTS = 5;

const SERVER = {
  host: '89.144.32.248',
  port: 1033
};

const PASSWORD = '#gxEcv#6dAz';

function createBot(id) {
  const bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: `rentacraftX${id}`
  });

  bot.on('spawn', () => {
    console.log(`${bot.username} spawned`);

    setTimeout(() => {
      bot.chat(`/register ${PASSWORD}`);
      bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
      bot.chat(`/login ${PASSWORD}`);
    }, 2000);
  });

  bot.on('kicked', (reason) => console.log(`${bot.username} kicked:`, reason));
  bot.on('error', (err) => console.log(`${bot.username} error:`, err));

  return bot;
}

function startBots(amount) {
  const count = Math.min(amount, MAX_BOTS);

  bots.length = 0;

  for (let i = 0; i < count; i++) {
    const bot = createBot(i);
    bots.push(bot);
  }

  return count;
}

function broadcast(message) {
  for (const bot of bots) {
    if (bot && bot.chat) {
      bot.chat(message);
    }
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const content = msg.content;

  // START BOTS
  if (content.startsWith('!mc start')) {
    const parts = content.split(' ');
    const amount = parseInt(parts[2] || '1');

    const started = startBots(amount);

    return msg.reply(`Started ${started} bots.`);
  }

  // CHAT BROADCAST
  if (content.startsWith('!mc chat ')) {
    const text = content.slice(10);

    if (bots.length === 0) {
      return msg.reply('No bots running.');
    }

    broadcast(text);

    return msg.reply('Sent to all bots.');
  }

  // STOP ALL BOTS
  if (content === '!mc stop') {
    for (const bot of bots) {
      if (bot) bot.end();
    }

    bots.length = 0;

    return msg.reply('Stopped all bots.');
  }
});

client.login(process.env.TOKEN);
