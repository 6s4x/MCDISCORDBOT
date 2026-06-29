const { Client, GatewayIntentBits, SlashCommandBuilder, MessageFlags } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const KFC_LOGO = `██╗   ██╗   ███████╗     ██████╗ 
██║  ██╔╝ ██╔════╝  ██╔════╝ 
█████╔╝  █████╗        ██║      
██╔═██╗  ██╔══╝        ██║      
██║   ██╗  ██║                ╚██████╗ 
╚═╝   ╚═╝  ╚═╝                   ╚═════╝`;

let running = false;
const SELFBOT_TOKEN = (process.env.SELFBOT_TOKEN || '').trim();

// Try raw first, then with Bot prefix if 401
let authHeader = SELFBOT_TOKEN;
let triedBotPrefix = false;

async function discordFetch(method, endpoint, data = null) {
    const url = `https://discord.com/api/v9${endpoint}`;
    const options = {
        method,
        headers: {
            'Authorization': authHeader,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/json'
        }
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(url, options);
    const status = response.status;
    console.log(`📡 ${method} ${endpoint} → ${status}`);

    if (status === 401 && !triedBotPrefix) {
        triedBotPrefix = true;
        authHeader = 'Bot ' + SELFBOT_TOKEN;
        console.log('🔄 Retrying with Bot prefix...');
        return await discordFetch(method, endpoint, data);
    }

    const text = await response.text();
    if (status >= 400) {
        console.log(`❌ ${status}: ${text.slice(0, 200)}`);
        return null;
    }
    try { return JSON.parse(text); }
    catch { console.log('❌ Invalid JSON'); return null; }
}

async function sendMsg(channelId, content, replyToId = null) {
    const payload = { content };
    if (replyToId) payload.message_reference = { message_id: replyToId, fail_if_not_exists: false };
    return await discordFetch('POST', `/channels/${channelId}/messages`, payload);
}

async function executeCwel(guildId, args) {
    console.log('📋 Starting...');
    const channels = await discordFetch('GET', `/guilds/${guildId}/channels`);
    const members = await discordFetch('GET', `/guilds/${guildId}/members?limit=1000`);
    if (!channels) { console.log('❌ Failed channels'); return false; }

    const tc = channels.filter(c => c.type === 0);
    const nb = members ? members.filter(m => !m.user.bot) : [];
    const laggy = '][[[][][][]][][[]][][[][][[][]';
    console.log(`✅ ${tc.length} channels, ${nb.length} members`);

    if (!tc[0]) return false;
    const init = await sendMsg(tc[0].id, `🍗 KFC\n${args || ''}`);
    if (!init) return false;

    let li = init.id;
    for (let i = 0; i < 5; i++) {
        if (!running) break;
        const sh = [...nb].sort(() => Math.random() - 0.5).slice(0, 10);
        const pi = sh.map(m => `<@${m.user.id}>`).join(' ');
        const co = args ? `${args} ${pi}` : `${laggy} ${pi}`;
        const ch = tc[i % tc.length];
        const r = await sendMsg(ch.id, co, li);
        if (r) { li = r.id; console.log(`📨 ${i+1}/5 ${ch.name}`); }
        await new Promise(r => setTimeout(r, 1500));
    }
    return true;
}

client.once('ready', () => {
    console.log(`🔧 User App logged in as ${client.user.tag}`);
    console.log(KFC_LOGO);
});

client.on('ready', async () => {
    await client.application.commands.set([
        new SlashCommandBuilder().setName('zlamzasady').setDescription('KFC bot').addStringOption(o => o.setName('args').setDescription('Args').setRequired(false)),
        new SlashCommandBuilder().setName('cwel').setDescription('Selfbot').addStringOption(o => o.setName('args').setDescription('Msg').setRequired(false)),
        new SlashCommandBuilder().setName('stop').setDescription('Stop')
    ]);
    console.log('✅ Commands synced');
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (!interaction.isChatInputCommand()) return;
        const gid = interaction.guildId;
        if (!gid) { await interaction.reply({ content: '❌ Server only', flags: MessageFlags.Ephemeral }); return; }

        if (interaction.commandName === 'zlamzasady') {
            const args = interaction.options.getString('args') || '';
            await interaction.reply({ content: '🍗 Working...', flags: MessageFlags.Ephemeral });
            console.log(`⚔️ ZlamZasady | args: "${args}"`);

            running = true;
            await executeCwel(gid, args);

            while (running) {
                const chs = await discordFetch('GET', `/guilds/${gid}/channels`);
                const ms = await discordFetch('GET', `/guilds/${gid}/members?limit=1000`);
                if (!chs || !ms) break;
                const tc = chs.filter(c => c.type === 0);
                const nb = ms.filter(m => !m.user.bot);
                const lg = '][[[][][][]][][[]][][[][][[][]';
                for (const c of tc) {
                    if (!running) break; let li = null;
                    for (let i = 0; i < 5; i++) {
                        if (!running) break;
                        const sh = [...nb].sort(() => Math.random() - 0.5).slice(0, 10);
                        const pi = sh.map(m => `<@${m.user.id}>`).join(' ');
                        const co = args ? `${args} ${pi}` : `${lg} ${pi}`;
                        const r = await sendMsg(c.id, co, li);
                        if (r) { li = r.id; console.log(`📨 ${i+1}/5 ${c.name}`); }
                        await new Promise(r => setTimeout(r, 1500));
                    }
                }
            }
        }

        if (interaction.commandName === 'cwel') {
            const args = interaction.options.getString('args') || '';
            await interaction.reply({ content: '⚡ /cwel...', flags: MessageFlags.Ephemeral });
            await executeCwel(gid, args);
        }

        if (interaction.commandName === 'stop') {
            running = false;
            await interaction.reply({ content: '🛑 Stopped', flags: MessageFlags.Ephemeral });
            process.exit(0);
        }
    } catch (error) {
        console.log(`❌ ${error.message}`);
        try { if (!interaction.replied) await interaction.reply({ content: '❌ Error', flags: MessageFlags.Ephemeral }); } catch(e) {}
    }
});

client.login(process.env.USER_APP_TOKEN);