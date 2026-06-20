const { Client, GatewayIntentBits } = require('discord.js');
const { spawn } = require('child_process');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let mcc = null;

function startMCC() {
    if (mcc) return;

    const fs = require('fs');

    try {
        fs.chmodSync('./MinecraftClient', 0o755);
    } catch {}

    mcc = require('child_process').spawn('bash', ['./MinecraftClient']);

    mcc.stdout.on('data', d => console.log('[MCC]', d.toString()));
    mcc.stderr.on('data', d => console.log('[MCC ERR]', d.toString()));

    mcc.on('close', c => {
        console.log('MCC closed:', c);
        mcc = null;
        setTimeout(startMCC, 5000);
    });
}

client.once('ready', () => {

    console.log(`Logged in as ${client.user.tag}`);

});

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    if (message.content === '!mc start') {

        if (mcc)
            return message.reply('Already running.');

        startMCC();

        return message.reply('Started MCC.');
    }

    if (message.content === '!mc stop') {

        if (!mcc)
            return message.reply('Not running.');

        mcc.stdin.write('/quit\n');

        return message.reply('Stopping MCC.');
    }

    if (message.content.startsWith('!mc send ')) {

        if (!mcc)
            return message.reply('MCC is not running.');

        const cmd = message.content.slice(9);

        mcc.stdin.write(cmd + '\n');

        return message.reply(`Sent: ${cmd}`);
    }

});

client.login(process.env.TOKEN);
