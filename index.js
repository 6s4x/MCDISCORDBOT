const mineflayer = require('mineflayer');
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const bots = new Map(); // id -> bot instance

const SERVER = {
  host: '89.144.32.248',
  port: 1033
};

const PASSWORD = '#gxEcv#6dAz';
const MAX_BOTS = 6;

// ─────────────────────────────────────────────
// UTIL: backoff reconnect (no spam)
// ─────────────────────────────────────────────
function backoffTime(attempt) {
  return Math.min(30000, 2000 * Math.pow(2, attempt));
}

// ─────────────────────────────────────────────
// CREATE BOT
// ─────────────────────────────────────────────
function createBot(id, attempt = 0) {
  const username = `rentacraftX${id}`;

  const bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username
  });

  bots.set(id, { bot, attempt });

  bot.on('spawn', () => {
    console.log(`${username} spawned`);

    setTimeout(() => {
      bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
      bot.chat(`/login ${PASSWORD}`);
    }, 2000);
  });

  // ───────────── Minecraft → Discord ─────────────
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    const channel = client.channels.cache.find(c => c?.name === 'mc-chat');
    if (channel) channel.send(`⛏️ **${username}**: ${message}`);
  });

  // ───────────── ERROR HANDLING ─────────────
  bot.on('kicked', (reason) => {
    console.log(`${username} kicked:`, reason);
  });

  bot.on('error', (err) => {
    console.log(`${username} error:`, err);
  });

  bot.on('end', () => {
    console.log(`${username} disconnected`);

    const data = bots.get(id);
    const nextAttempt = (data?.attempt || 0) + 1;

    const delay = backoffTime(nextAttempt);

    console.log(`Reconnecting ${username} in ${delay}ms`);

    setTimeout(() => {
      createBot(id, nextAttempt);
    }, delay);
  });

  return bot;
}

// ─────────────────────────────────────────────
// START BOTS (NO QUEUE, BUT SAFE DELAY)
// ─────────────────────────────────────────────
async function startBots(amount) {
  const count = Math.min(amount, MAX_BOTS);

  bots.clear();

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      createBot(i);
    }, i * 5000); // prevents throttling WITHOUT queue system
  }

  return count;
}

// ─────────────────────────────────────────────
// BROADCAST
// ─────────────────────────────────────────────
function broadcast(message) {
  for (const { bot } of bots.values()) {
    if (bot?.chat) bot.chat(message);
  }
}

// ─────────────────────────────────────────────
// DISCORD BOT
// ─────────────────────────────────────────────
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  // START
  if (msg.content.startsWith('!mc start')) {
    const amount = parseInt(msg.content.split(' ')[2] || '1');

    const started = await startBots(amount);

    return msg.reply(`Started ${started} bots.`);
  }

  // CHAT → MC
  if (msg.content.startsWith('!mc chat ')) {
    const text = msg.content.slice(10);
    broadcast(text);

    return msg.reply('sent');
  }

  // STOP
  if (msg.content === '!mc stop') {
    for (const { bot } of bots.values()) {
      try { bot.end(); } catch {}
    }

    bots.clear();

    return msg.reply('stopped all bots');
  }
});

client.login(process.env.TOKEN);
