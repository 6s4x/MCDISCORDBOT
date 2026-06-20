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
const MAX_BOTS = 3;

// ─────────────────────────────
// BOT STATE STORE
// ─────────────────────────────
const botState = {
  0: { bot: null, status: 'offline' },
  1: { bot: null, status: 'offline' },
  2: { bot: null, status: 'offline' }
};

// ─────────────────────────────
// CREATE BOT
// ─────────────────────────────
function createBot(id) {
  if (botState[id]?.bot && botState[id].status === 'online') {
    return;
  }

  const bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: `rentacraftX${id}_${Date.now()}`
  });

  botState[id] = { bot, status: 'connecting' };

  bot.on('spawn', () => {
    console.log(`rentacraftX${id} spawned`);

    botState[id].status = 'online';

    setTimeout(() => {
      bot.chat(`/register ${PASSWORD}`);
      bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
      bot.chat(`/login ${PASSWORD}`);
    }, 2000);
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    const channel = client.channels.cache.find(c => c.name === 'mc-chat');
    if (channel) {
      channel.send(`⛏️ **${username}**: ${message}`);
    }
  });

  bot.on('end', () => {
    console.log(`rentacraftX${id} disconnected`);

    botState[id].bot = null;
    botState[id].status = 'offline';
  });

  bot.on('kicked', (reason) => {
    console.log(`rentacraftX${id} kicked:`, reason);

    botState[id].bot = null;
    botState[id].status = 'offline';
  });

  bot.on('error', (err) => {
    console.log(`rentacraftX${id} error:`, err);
  });
}

// ─────────────────────────────
// START BOTS (STATE CHECK, NO QUEUE)
// ─────────────────────────────
function startBots(amount) {
  const count = Math.min(amount, MAX_BOTS);

  for (let i = 0; i < count; i++) {
    const state = botState[i];

    // already online → skip
    if (state?.bot && state.status === 'online') {
      continue;
    }

    createBot(i);
  }

  return count;
}

// ─────────────────────────────
// BROADCAST CHAT
// ─────────────────────────────
function broadcast(message) {
  for (const id in botState) {
    const bot = botState[id].bot;

    if (bot && bot.chat) {
      bot.chat(message);
    }
  }
}

// ─────────────────────────────
// DISCORD EVENTS
// ─────────────────────────────
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;

  const content = msg.content;

  // START BOTS
  if (content.startsWith('!mc start')) {
    const amount = parseInt(content.split(' ')[2] || '1');

    const started = startBots(amount);

    return msg.reply(`Ensuring ${started} bots are online.`);
  }

  // CHAT TO MC
  if (content.startsWith('!mc chat ')) {
    const text = content.slice(10);

    broadcast(text);

    return msg.reply('sent');
  }

  // STATUS
  if (content === '!mc status') {
    const status = Object.entries(botState)
      .map(([id, b]) => `X${id}: ${b.status}`)
      .join('\n');

    return msg.reply(status);
  }

  // STOP ALL
  if (content === '!mc stop') {
    for (const id in botState) {
      if (botState[id].bot) {
        try { botState[id].bot.end(); } catch {}
        botState[id] = { bot: null, status: 'offline' };
      }
    }

    return msg.reply('stopped all bots');
  }
});

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
client.login(process.env.TOKEN);
