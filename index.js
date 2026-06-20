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
  host: '89.144.248.248',
  port: 1033
};

const PASSWORD = '#gxEcv#6dAz';

// ─────────────────────────────
// SWARM STATE
// ─────────────────────────────
const bots = new Map();        // id -> bot
const status = new Map();      // id -> online/offline

let targetSize = 0;

// adaptive throttle control
let spawnDelay = 2000; // starts safe
const MIN_DELAY = 800;
const MAX_DELAY = 15000;

// queue system
const spawnQueue = [];
let spawning = false;

// ─────────────────────────────
// UTIL
// ─────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────
// ADAPTIVE SPEED CONTROL
// ─────────────────────────────
function adjustSpeed(success) {
  if (success) {
    spawnDelay = Math.max(MIN_DELAY, spawnDelay - 150);
  } else {
    spawnDelay = Math.min(MAX_DELAY, spawnDelay + 1000);
  }

  console.log(`[SWARM] spawnDelay = ${spawnDelay}ms`);
}

// ─────────────────────────────
// BOT CREATION
// ─────────────────────────────
function createBot(id) {
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
    adjustSpeed(true);

    console.log(`✔ Bot ${id} joined`);

    setTimeout(() => {
      try {
        bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
        bot.chat(`/login ${PASSWORD}`);
      } catch {}
    }, 2500);
  });

  bot.on('end', () => handleDeath(id));
  bot.on('error', () => handleDeath(id));
}

// ─────────────────────────────
// DEATH HANDLER
// ─────────────────────────────
function handleDeath(id) {
  bots.delete(id);
  status.set(id, 'offline');

  adjustSpeed(false);

  // auto replace ONLY if still needed
  if (id < targetSize) {
    queueSpawn(id);
  }
}

// ─────────────────────────────
// SAFE QUEUE SYSTEM
// ─────────────────────────────
function queueSpawn(id) {
  if (spawnQueue.includes(id)) return;
  spawnQueue.push(id);
  processQueue();
}

async function processQueue() {
  if (spawning) return;
  spawning = true;

  while (spawnQueue.length > 0) {
    const id = spawnQueue.shift();

    createBot(id);

    await sleep(spawnDelay);
  }

  spawning = false;
}

// ─────────────────────────────
// START SWARM
// ─────────────────────────────
function startSwarm(size) {
  targetSize = size;

  for (let i = 0; i < size; i++) {
    if (!bots.has(i)) {
      queueSpawn(i);
    }
  }
}

// ─────────────────────────────
// CHAT ALL BOTS
// ─────────────────────────────
function broadcast(msg) {
  for (const bot of bots.values()) {
    try {
      bot.chat(msg);
    } catch {}
  }
}

// ─────────────────────────────
// DISCORD
// ─────────────────────────────
client.once('ready', () => {
  console.log('SMART SWARM V3 ONLINE');
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  if (msg.content.startsWith('!mc start')) {
    const n = parseInt(msg.content.split(' ')[2] || '1');
    startSwarm(n);
    return msg.reply(`swarm target set: ${n}`);
  }

  if (msg.content.startsWith('!mc chat ')) {
    broadcast(msg.content.slice(9));
    return msg.reply('sent');
  }

  if (msg.content === '!mc status') {
    const lines = [...status.entries()]
      .map(([id, s]) => `X${id}: ${s}`)
      .join('\n') || 'none';

    return msg.reply(`\`\`\`\n${lines}\n\`\`\``);
  }

  if (msg.content === '!mc stop') {
    for (const b of bots.values()) {
      try { b.end(); } catch {}
    }

    bots.clear();
    status.clear();
    spawnQueue.length = 0;
    targetSize = 0;

    return msg.reply('stopped swarm');
  }
});

client.login(process.env.TOKEN);
