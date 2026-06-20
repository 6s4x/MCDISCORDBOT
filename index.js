const mc = require('minecraft-protocol');
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ─────────────────────────────
// CONFIG
// ─────────────────────────────
const SERVER = {
  host: '89.144.32.248',
  port: 1033
};

const PASSWORD = '#gxEcv#6dAz';
const MAX_BOTS = 3;

// IMPORTANT: change this if server rejects 1.21.5
let protocolVersion = '1.21.5';

// ─────────────────────────────
// STATE
// ─────────────────────────────
const bots = { 0: null, 1: null, 2: null };
const status = { 0: 'offline', 1: 'offline', 2: 'offline' };

// ─────────────────────────────
// CREATE BOT (RAW PROTOCOL)
// ─────────────────────────────
function createBot(id) {
  if (bots[id]) return;

  const username = `rentacraftX${id}_${Date.now()}`;

  const bot = mc.createClient({
    host: SERVER.host,
    port: SERVER.port,
    username,
    version: protocolVersion
  });

  bots[id] = bot;
  status[id] = 'connecting';

  bot.on('login', () => {
    console.log(`Bot ${id} logged in`);
    status[id] = 'online';

    setTimeout(() => {
      try {
        bot.write('chat', { message: `/register ${PASSWORD}` });
        bot.write('chat', { message: `/register ${PASSWORD} ${PASSWORD}` });
        bot.write('chat', { message: `/login ${PASSWORD}` });
      } catch {}
    }, 3000);
  });

  bot.on('chat', (packet) => {
    const msg = packet.message?.toString?.() || '';

    const channel = client.channels.cache.find(c => c.name === 'mc-chat');
    if (channel) channel.send(`⛏️ ${msg}`);
  });

  bot.on('disconnect', (packet) => {
    console.log(`Bot ${id} disconnected`, packet);
    bots[id] = null;
    status[id] = 'offline';
  });

  bot.on('error', (err) => {
    console.log(`Bot ${id} error`, err);
    bots[id] = null;
    status[id] = 'offline';
  });
}

// ─────────────────────────────
// START BOTS (SAFE STATE CHECK)
// ─────────────────────────────
function startBots(amount) {
  const count = Math.min(amount, MAX_BOTS);

  for (let i = 0; i < count; i++) {
    if (!bots[i]) createBot(i);
  }

  return count;
}

// ─────────────────────────────
// BROADCAST
// ─────────────────────────────
function broadcast(message) {
  for (const id in bots) {
    const bot = bots[id];
    if (bot) {
      try {
        bot.write('chat', { message });
      } catch {}
    }
  }
}

// ─────────────────────────────
// DISCORD READY
// ─────────────────────────────
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ─────────────────────────────
// TEXT COMMANDS
// ─────────────────────────────
client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;

  // PANEL
  if (msg.content === '!mc panel') {
    const embed = new EmbedBuilder()
      .setTitle('MC CONTROL PANEL')
      .setDescription(
        Object.entries(status)
          .map(([id, s]) => `Bot X${id}: ${s}`)
          .join('\n')
      )
      .addFields({
        name: 'Protocol',
        value: protocolVersion
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('start')
        .setLabel('Start 3 Bots')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('stop')
        .setLabel('Stop All')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('refresh')
        .setLabel('Refresh')
        .setStyle(ButtonStyle.Primary)
    );

    return msg.reply({ embeds: [embed], components: [row] });
  }

  // CHAT
  if (msg.content.startsWith('!mc chat ')) {
    broadcast(msg.content.slice(10));
    return msg.reply('sent');
  }

  // STATUS
  if (msg.content === '!mc status') {
    return msg.reply(
      Object.entries(status)
        .map(([id, s]) => `X${id}: ${s}`)
        .join('\n')
    );
  }

  // START
  if (msg.content.startsWith('!mc start')) {
    const amount = parseInt(msg.content.split(' ')[2] || '1');
    startBots(amount);
    return msg.reply('starting bots');
  }
});

// ─────────────────────────────
// BUTTONS
// ─────────────────────────────
client.on('interactionCreate', async (i) => {
  if (!i.isButton()) return;

  if (i.customId === 'start') {
    startBots(3);
    return i.reply({ content: 'started 3 bots', ephemeral: true });
  }

  if (i.customId === 'stop') {
    for (const id in bots) {
      try { bots[id]?.end?.(); } catch {}
      bots[id] = null;
      status[id] = 'offline';
    }
    return i.reply({ content: 'stopped all bots', ephemeral: true });
  }

  if (i.customId === 'refresh') {
    return i.reply({
      content: Object.entries(status)
        .map(([id, s]) => `X${id}: ${s}`)
        .join('\n'),
      ephemeral: true
    });
  }
});

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
client.login(process.env.TOKEN);
