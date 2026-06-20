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

const PASSWORD = '#gxEcv#6dAz';

const bots = new Map(); // id -> bot
const status = new Map(); // id -> status

const JOIN_DELAY = 7000; // IMPORTANT: prevents throttling

// ─────────────────────────────
// UTIL
// ─────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────
// CREATE SINGLE BOT
// ─────────────────────────────
function createBot(id) {
  if (bots.has(id)) return;

  const bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: `rentacraftX${id}_${Math.floor(Math.random() * 9999)}`,
    version: false
  });

  bots.set(id, bot);
  status.set(id, 'connecting');

  bot.once('login', () => {
    status.set(id, 'online');
    console.log(`rentacraftX${id} joined`);

    setTimeout(() => {
      try {
        bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
        bot.chat(`/login ${PASSWORD}`);
      } catch {}
    }, 3000);
  });

  bot.on('end', () => {
    console.log(`rentacraftX${id} left`);
    bots.delete(id);
    status.set(id, 'offline');
  });

  bot.on('error', (err) => {
    console.log(`rentacraftX${id} error`, err.message);
    bots.delete(id);
    status.set(id, 'offline');
  });
}

// ─────────────────────────────
// START SWARM (SAFE STAGGER)
// ─────────────────────────────
async function startSwarm(amount) {
  amount = Math.min(amount, 20); // safety cap

  console.log(`Starting swarm: ${amount} bots`);

  for (let i = 0; i < amount; i++) {
    createBot(i);
    await sleep(JOIN_DELAY); // 🔥 THIS FIXES THROTTLING
  }
}

// ─────────────────────────────
// CHAT ALL BOTS
// ─────────────────────────────
function broadcast(message) {
  for (const bot of bots.values()) {
    try {
      bot.chat(message);
    } catch {}
  }
}

// ─────────────────────────────
// DISCORD
// ─────────────────────────────
client.once('ready', () => {
  console.log('Discord bot ready');
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  // START SWARM
  if (msg.content.startsWith('!mc start')) {
    const parts = msg.content.split(' ');
    const amount = parseInt(parts[2] || '1');

    await startSwarm(amount);
    return msg.reply(`starting ${amount} bots`);
  }

  // CHAT ALL
  if (msg.content.startsWith('!mc chat ')) {
    const text = msg.content.slice(9);
    broadcast(text);
    return msg.reply('sent');
  }

  // STATUS
  if (msg.content === '!mc status') {
    const lines = [...status.entries()]
      .map(([id, s]) => `X${id}: ${s}`)
      .join('\n') || 'no bots';

    return msg.reply('```\n' + lines + '\n```');
  }

  // STOP ALL
  if (msg.content === '!mc stop') {
    for (const bot of bots.values()) {
      try { bot.end(); } catch {}
    }

    bots.clear();
    status.clear();

    return msg.reply('stopped all bots');
  }
});

client.login(process.env.TOKEN);
