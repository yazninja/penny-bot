import { Client, GatewayIntentBits, Partials, Events, User, Collection } from 'discord.js';
import 'dotenv/config';
import consola from 'consola';
import { readdirSync } from 'fs';
import { ChatGPTAPI } from 'chatgpt';
import { Player } from 'discord-player';

declare module 'discord.js' {
    export interface Client {
        amAPIToken: string;
        commands: Collection<unknown, any>;
        replies: Collection<unknown, any>;
        player: Player;
        chatbot: ChatGPTAPI;
        confessionCount: number;
        ventCount: number;
    }
}

export const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution
    ],
    partials: [Partials.User, Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.GuildScheduledEvent, Partials.ThreadMember]
});

client.confessionCount = 0;
client.ventCount = 0;
client.player = new Player(client, { skipFFmpeg: false });
await client.player.extractors.loadDefault();
client.commands = new Collection();
client.replies = new Collection();
client.chatbot = new ChatGPTAPI({ apiKey: process.env.OPENAI_KEY as string, completionParams: { model: 'gpt-4' } });

const mainFolder = process.env.NODE_ENV === 'development' ? 'src' : 'build';
const fileType = process.env.NODE_ENV === 'development' ? '.ts' : '.js';

/** REGISTER REPLIES */
const replyFiles = readdirSync('./lib/replies').filter((file) => file.endsWith('.json'));
for (const file of replyFiles) {
    let { default: reply } = await import(`../lib/replies/${file}`, { assert: { type: 'json' } });
    client.replies.set(reply.name.toLowerCase().replace(/\s/g, '-'), reply);
    consola.info('\x1b[32m%s\x1b[0m', 'Registered Reply:', reply.name);
}

/** REGISTER COMMANDS */
const commandFolders = readdirSync(`./${mainFolder}/commands/`);
for (const folder of commandFolders) {
    const commandFiles = readdirSync(`./${mainFolder}/commands/${folder}`).filter((file) => file.endsWith(fileType));
    for (const file of commandFiles) {
        const { command } = await import(`./commands/${folder}/${file}`);
        client.commands.set(command.data.name, command);
        consola.info('\x1b[32m%s\x1b[0m', 'Registered Command:', command.data.name, command?.category);
    }
}

const eventFiles = readdirSync(`./${mainFolder}/events`).filter((file) => file.endsWith(fileType));
for (const file of eventFiles) {
    const event = (await import(`./events/${file}`)).default;
    consola.info(`Loaded event: ${event.name}`);
    if (event?.devOnly && process.env.NODE_ENV !== 'development') continue;
    if (event?.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(process.env.AUTH_TOKEN);

/*** ERROR HANDLING ***/
process.on('unhandledRejection', (error: Error) => {
    consola.info('Unhandled Rejection');
    consola.error(error);
    consola.error(error.stack);
    // let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
    // client.channels.cache.get(process.env.errorChannel).send({ content: `Unhandled Rejection`, embeds: [errorEmbed] })
});
process.on('uncaughtException', (error: Error) => {
    consola.info('Uncaught Exception');
    consola.error(error);
    consola.error(error.stack);
    // let errorEmbed = { color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }
    // client.channels.cache.get(process.env.errorChannel).send({ content: `Uncaught Exception`, embeds: [errorEmbed] })
});
