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

const TARGET_BOTS = new Map();   // desired count
const ACTIVE_BOTS = new Map();   // running bots

// ─────────────────────────────
// CREATE BOT (SAFE JOIN)
// ─────────────────────────────
function createBot(id) {
  const bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: `rentacraftX${id}_${Math.floor(Math.random() * 9999)}`,
    version: false
  });

  ACTIVE_BOTS.set(id, bot);

  bot.once('login', () => {
    console.log(`X${id} joined`);

    setTimeout(() => {
      bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
      bot.chat(`/login ${PASSWORD}`);
    }, 2500);
  });

  bot.on('end', () => handleDeath(id));
  bot.on('error', () => handleDeath(id));
}

// ─────────────────────────────
// AUTO REPLACE DEAD BOT
// ─────────────────────────────
function handleDeath(id) {
  ACTIVE_BOTS.delete(id);

  if (TARGET_BOTS.has(id)) {
    // respawn instantly BUT only ONE at a time
    setTimeout(() => createBot(id), 2000);
  }
}

// ─────────────────────────────
// SWARM CONTROLLER
// ─────────────────────────────
function setSwarmSize(size) {
  for (let i = 0; i < size; i++) {
    TARGET_BOTS.set(i, true);

    if (!ACTIVE_BOTS.has(i)) {
      setTimeout(() => createBot(i), i * 1500); // controlled stagger
    }
  }
}

// ─────────────────────────────
// DISCORD
// ─────────────────────────────
client.once('ready', () => {
  console.log('ready');
});

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  if (msg.content.startsWith('!mc start')) {
    const n = parseInt(msg.content.split(' ')[2] || '3');

    setSwarmSize(n);
    return msg.reply(`swarm set to ${n}`);
  }

  if (msg.content === '!mc status') {
    return msg.reply(
      `online: ${ACTIVE_BOTS.size} / target: ${TARGET_BOTS.size}`
    );
  }

  if (msg.content.startsWith('!mc chat ')) {
    const text = msg.content.slice(9);

    for (const bot of ACTIVE_BOTS.values()) {
      try { bot.chat(text); } catch {}
    }

    return msg.reply('sent');
  }
});

client.login(process.env.TOKEN);
