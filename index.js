const mc = require('minecraft-protocol');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

const bots = { 0: null, 1: null, 2: null };
const status = { 0: 'offline', 1: 'offline', 2: 'offline' };

// IMPORTANT: leave AUTO MODE ON
let autoMode = true;

// ─────────────────────────────
// CREATE BOT
// ─────────────────────────────
function createBot(id) {
  if (bots[id]) return;

  const bot = mc.createClient({
    host: SERVER.host,
    port: SERVER.port,
    username: `rentacraftX${id}_${Date.now()}`,

    // THIS FIXES YOUR 1.21.5 ISSUE
    version: autoMode ? false : '1.21.5'
  });

  bots[id] = bot;
  status[id] = 'connecting';

  bot.on('login', () => {
    status[id] = 'online';
    console.log(`Bot ${id} logged in`);

    setTimeout(() => {
      try {
        bot.write('chat', { message: `/register ${PASSWORD} ${PASSWORD}` });
        bot.write('chat', { message: `/login ${PASSWORD}` });
      } catch {}
    }, 2500);
  });

  bot.on('end', () => {
    status[id] = 'offline';
    bots[id] = null;
  });

  bot.on('error', (err) => {
    console.log(`Bot ${id} error:`, err.message);
    status[id] = 'offline';
    bots[id] = null;
  });
}

// ─────────────────────────────
// START BOTS
// ─────────────────────────────
function startBots(amount) {
  const count = Math.min(amount, MAX_BOTS);

  for (let i = 0; i < count; i++) {
    if (!bots[i]) createBot(i);
  }

  return count;
}

// ─────────────────────────────
// BROADCAST CHAT
// ─────────────────────────────
function broadcast(msg) {
  for (const id in bots) {
    try {
      bots[id]?.write('chat', { message: msg });
    } catch {}
  }
}

// ─────────────────────────────
// PANEL
// ─────────────────────────────
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;

  if (msg.content === '!mc panel') {
    const embed = new EmbedBuilder()
      .setTitle('MC CONTROL PANEL')
      .setDescription(
        Object.entries(status)
          .map(([id, s]) => `Bot X${id}: ${s}`)
          .join('\n')
      )
      .addFields({
        name: 'Mode',
        value: autoMode ? 'AUTO (RECOMMENDED)' : 'FORCED 1.21.5'
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('start')
        .setLabel('Start Bots')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('stop')
        .setLabel('Stop Bots')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('toggle')
        .setLabel('Toggle Mode')
        .setStyle(ButtonStyle.Primary)
    );

    return msg.reply({ embeds: [embed], components: [row] });
  }

  if (msg.content.startsWith('!mc start')) {
    const amount = parseInt(msg.content.split(' ')[2] || '1');
    startBots(amount);
    return msg.reply('starting bots');
  }

  if (msg.content.startsWith('!mc chat ')) {
    broadcast(msg.content.slice(10));
    return msg.reply('sent');
  }
});

// ─────────────────────────────
// BUTTONS
// ─────────────────────────────
client.on('interactionCreate', async (i) => {
  if (!i.isButton()) return;

  if (i.customId === 'start') {
    startBots(3);
    return i.reply({ content: 'started', ephemeral: true });
  }

  if (i.customId === 'stop') {
    for (const id in bots) {
      try { bots[id]?.end?.(); } catch {}
      bots[id] = null;
      status[id] = 'offline';
    }
    return i.reply({ content: 'stopped', ephemeral: true });
  }

  if (i.customId === 'toggle') {
    autoMode = !autoMode;
    return i.reply({
      content: autoMode ? 'AUTO MODE ON' : 'FORCED 1.21.5',
      ephemeral: true
    });
  }
});

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
client.login(process.env.TOKEN);
