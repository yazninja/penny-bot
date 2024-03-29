import 'dotenv/config';
import consola from 'consola';
import { Client, GatewayIntentBits, ActivityType, Collection, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { Player } from 'discord-player';
import { readdirSync } from 'fs';
import { getColorFromURL } from 'color-thief-node';
import { getAPIToken } from "./integrations/musickitAPI.js";
import { initializeSoundCloud } from './integrations/playdl.js'
import { ChatGPT } from "./lib/openai.js";
// import { db } from "./integrations/firebase.js"
let prompts = (await import("./data/prompts.json", { assert: { type: "json" } })).default;
let reassure = (await import("./data/reassurance.json", { assert: { type: "json" } })).default;
let welcome = (await import("./data/welcome.json", { assert: { type: "json" } })).default;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction]
});
client.player = new Player(client, { ytdlOptions: { quality: 'highestaudio' } });
client.chatbot = new ChatGPT({ sessionToken: process.env.SESSION_TOKEN });
client.accessToken = null;
client.chatSessions = new Map();
client.openAILogo = 'https://openai.com/content/images/2022/05/openai-avatar.png'
client.amAPIToken = await getAPIToken();
client.commands = new Collection();

const consolaDebug = consola.create({ level: 5 })
export { client };


// Import Command Files
const commandFolders = readdirSync('./src/commands/');
for (const folder of commandFolders) {
    const commandFiles = readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const { command } = await import(`./commands/${folder}/${file}`);
        client.commands.set(command.data.name, command);
        consola.info("\x1b[32m%s\x1b[0m", "Registered Command:", command.data.name, command?.category);
    }
}

client.on("ready", () => {
    consola.success(`Logged in as ${client.user.tag} at ${Date()}`);
    client.user.setActivity(`Writers Guild`, { type: ActivityType.Listening });
    initializeSoundCloud();
    client.chatbot.refreshAccessToken().then(token => {
        client.accessToken = token;
        consola.success("Generated new access token");
    }).catch(err => consola.error(err));
    setInterval(async () => {
        client.chatbot.refreshAccessToken().then(token => {
            client.accessToken = token
            consola.success("Refreshed access token - " + client.accessToken);
        }).catch(err => consola.error(err));
    }, 1000 * 60); //refresh access token every 1 minute

});




client.on("guildMemberAdd", async (member) => {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL);
    const newEmbed = new EmbedBuilder()
        .setColor(await getColorFromURL(member.user.avatarURL({extension: 'png', size: 128})))
        .setAuthor({
            name: `Welcome to ${member.guild.name}!`,
            iconURL: client.user.avatarURL(),
        })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`I am Penny and welcome to the server, <@${member.user.id}>. Please read the rules and regulations in <#${process.env.RULE_CHANNEL}> and introduce yourselves in <#${process.env.INTRO_CHANNEL}>!`)
        .setFooter({ text: welcome[Math.floor(Math.random() * welcome.length)], iconURL: member.guild.iconURL() })
    await channel.send({ embeds: [newEmbed] });
});

client.on('interactionCreate', async interaction => {
    // if (!interaction.isChatInputCommand()) return;
    if (interaction.isSelectMenu()) {
        if (!client.interactions.get(interaction.customId)) return;
        try {
            await client.interactions.get(interaction.customId).execute(interaction);
        } catch (error) {
            consola.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    } else if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            consola.error(error);
            await interaction.reply({ title: "Error", content: 'There was an error while executing this command!', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        try {
            if(interaction.customId.split('|')[1] != null) {
                await client.interactions.get(interaction.customId.split('|')[0]).execute(interaction);
            } else {
                const command = client.commands.get(interaction.customId);
                await command.execute(interaction);
            }
        } catch (error) {
            consola.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }

    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if ((message.channelId === process.env.OPENAI_CHANNEL) && message.content.match(/hey penny/gi)) {
        try {
            await message.react('🤔');
            let prompt = message.content.replace(/hey penny,/gi, "").replace(/hey penny/gi, "");
            prompt = prompt.trim()
            prompt = prompt.charAt(0).toUpperCase() + prompt.slice(1);
            await client.chatbot.send(client.accessToken, prompt).then(async response => {
                await message.reactions.removeAll();
                await message.react('✅');
                let embed = new EmbedBuilder()
                    .setAuthor({ name: "OpenAI ChatGPT", iconURL: client.openAILogo })
                    .setTitle(prompt)
                    .setDescription(response.message)
                    .setColor("Gold")
                    .setFooter({ text: `Requested by ${message.author.tag} | ${response.id.split("-")[0]}`, iconURL: message.author.avatarURL() })
                    .addFields({ name: "Conversation ID", value: `${response.conversationId}`, inline: true })
                    .setTimestamp()
                message.reply({ embeds: [embed] });
            }).catch(async err => {
                consola.error(err)
                await message.reactions.removeAll();
                await message.react('❌');
                await message.reply({ content: "Something went wrong, please try again later." + err.name.split(" ")[err.name.split(" ").length - 1] });

            })
        } catch (error) {
            consola.error(error);
        }
    } else if (message.content.endsWith("?")) {
        let random = Math.floor(Math.random() * 10) + 1; // 10% chance of replying
        console.log(random);
        if (random == 1) {
            try {
                let response = await client.chatbot.send(client.accessToken, message.content);
                console.log(response)
                if (response.startsWith("I'm sorry")) return;
                let embed = new EmbedBuilder()
                    .setAuthor({ name: "OpenAI ChatGPT", iconURL: client.openAILogo })
                    .setTitle(prompt)
                    .setDescription(response.message)
                    .setColor("Gold")
                    .setFooter({ text: `Requested by ${message.author.tag} | ${response.id.split("-")[0]}`, iconURL: message.author.avatarURL() })
                    .addFields({ name: "Conversation ID", value: `${response.conversationId}`, inline: true })
                    .setTimestamp()
                message.reply({ embeds: [embed] });
            } catch (error) {
                consola.error(error);
            }


        }
    }else if (message.content === "Hello") {
        message.channel.send("Hi! :heart:");
    } else if (message.content === "Good night") {
        message.channel.send("Sleep well, fellow writers! :zzz:");
    } else if (message.content === "Okay, Penny is back online") {
        message.channel.send(
            "Yes? —Hey! I-it's not like I'm expecting you to call me or something, you sussy baka!"
        );
    } else if (
        message.content === "Me? A sussy baka? Where'd you get that from?"
    ) {
        message.channel.send(
            "It's because your sus and a baka so sussy baka :stuck_out_tongue:"
        );
    } else if (
        message.content === "You stop that attitude right now, Missy. I created you"
    ) {
        message.channel.send(
            "Of course you did, you programmed me to do this after all"
        );
    } else if (message.content === "Wait, how'd you—") {
        message.channel.send("It's called Breaking the 4th wall, *duh*");
    } else if (message.content === "Damnit") {
        message.channel.send("Hehe");
    } else if (message.content === "!prompt") {
        if (message.channel != process.env.PROMPT_CHANNEL) return await message.reply({
            content: `To use this command go to <#${process.env.PROMPT_CHANNEL}>`,
            ephemeral: true,
        }).then((m) => setTimeout(() => { m.delete(); message.delete() }, 5000));
        return message.channel.send(prompts[Math.floor(Math.random() * prompts.length)]);
    } else if (message.content === "!reassure") {
        if (message.channel != process.env.REASSURE_CHANNEL) return await message.reply({
            content: `To use this command go to <#${process.env.REASSURE_CHANNEL}>`,
            ephemeral: true,
        }).then((m) => setTimeout(() => { m.delete(); message.delete() }, 5000));
        return message.channel.send(reassure[Math.floor(Math.random() * reassure.length)]);
    } else if(message.content.includes("yaz")) {
        const test12 = await db.collection('yaz').doc('penny-bot').collection('confession').doc('counters').get();
        if (!test12.exists) {
            console.log('No such document!');
          } else {
            console.log('Document data:', test12.data());
          }
    // } else if(message.content.includes("spam justine for fun")) {
    //     await message.react("👍");
    //     await justine.send("I'm sorry, this wont happen again")
    }
});

let npInterval, npEmbed;
client.player.on('trackStart', async (queue, track) => {
    // consola.info("Track:", track)
    // consola.info("Queue Options", queue.options);
    // consola.info("Player Info", queue.player.voiceUtils);
    // consola.info("Voice Connection", queue.player.voiceUtils.getConnection('585180490202349578').audioResource);
    // consola.info("Audio Resource", queue.player.voiceUtils.getConnection('585180490202349578').audioResource);
    // consola.info("Audio Player", queue.player.voiceUtils.getConnection('585180490202349578').audioPlayer);
    // consola.info("Channel", queue.player.voiceUtils.getConnection('585180490202349578').channel);
    let slidebar = queue.createProgressBar();
    npEmbed = await queue.metadata.channel.send({
        embeds: [new EmbedBuilder()
            .setTitle(`${track.title}`)
            .setAuthor({
                name: `${client.user.username} | Now Playing`,
                iconURL: client.user.avatarURL(),
            })
            .setDescription(`${track.description + "\n" || ""}${queue.connection.paused ? ':pause_button:' : ':arrow_forward:'} ${slidebar}`)
            .setColor(0x4b98dc)
            .setThumbnail(`${track.thumbnail}`)
            .setURL(`${Number.isInteger(track.views) ? track.url : track.views}`)
            .setFooter({ text: queue.tracks[0] != null ? `Next Track: ${queue.tracks[0].title}` : 'No more tracks in queue' })
        ],
        components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setEmoji('🔀').setStyle(ButtonStyle.Secondary).setCustomId('shuffle').setDisabled(queue.tracks.length < 2),
            new ButtonBuilder().setEmoji('⏮️').setStyle(ButtonStyle.Secondary).setCustomId('previous').setDisabled(queue.previousTracks.length < 1),
            new ButtonBuilder().setEmoji(queue.connection.paused ? '▶️' : '⏸️').setStyle(ButtonStyle.Secondary).setCustomId(queue.connection.paused ? 'resume' : 'pause'),
            new ButtonBuilder().setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setCustomId('skip').setDisabled(queue.tracks.length < 1),
            new ButtonBuilder().setEmoji('🔁').setStyle(ButtonStyle.Secondary).setCustomId('loop').setDisabled(queue.tracks.length < 1))
        ]
    });

    npInterval = setInterval(async () => {
        slidebar = queue.createProgressBar();
        await npEmbed.edit({
            embeds: [new EmbedBuilder()
                .setTitle(`${queue.current.title}`)
                .setAuthor({
                    name: `${client.user.username} | Now Playing`,
                    iconURL: client.user.avatarURL(),
                })
                .setDescription(`${track.description + "\n" || ""}${queue.connection.paused ? ':pause_button:' : ':arrow_forward:'} ${slidebar}`)
                .setColor(0x4b98dc)
                .setThumbnail(`${track.thumbnail}`)
                .setURL(`${Number.isInteger(track.views) ? track.url : track.views}`)
                .setFooter({ text: queue.tracks[0] != null ? `Next Track: ${queue.tracks[0].title}` : 'No more tracks in queue' })
            ],
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setEmoji('🔀').setStyle(ButtonStyle.Secondary).setCustomId('shuffle').setDisabled(queue.tracks.length < 2),
                new ButtonBuilder().setEmoji('⏮️').setStyle(ButtonStyle.Secondary).setCustomId('previous').setDisabled(queue.previousTracks.length < 1),
                new ButtonBuilder().setEmoji(queue.connection.paused ? '▶️' : '⏸️').setStyle(ButtonStyle.Secondary).setCustomId(queue.connection.paused ? 'resume' : 'pause'),
                new ButtonBuilder().setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setCustomId('skip').setDisabled(queue.tracks.length < 1),
                new ButtonBuilder().setEmoji('🔁').setStyle(ButtonStyle.Secondary).setCustomId('loop').setDisabled(queue.tracks.length < 1))
            ]
        })
    }, 5000);
})

client.player.on('trackEnd', async (queue, track) => {
    clearInterval(npInterval);
    await npEmbed.delete();
})

client.player.on('connectionError', async (queue, error) => {
    queue.destroy();
    if (npInterval) clearInterval(npInterval);
    consola.error(error)
    await queue.metadata.channel.send({ content: `There was an error playing the track!`, embeds: [{ color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }] })
})
client.player.on('debug', async (queue, message) => {
    consolaDebug.debug(message)
})
client.player.on('botDisconnect', async (queue) => {
    queue.stop();
    queue.destroy();
    if (npInterval) clearInterval(npInterval);
})
client.player.on('error', async (queue, error) => {
    queue.stop();
    queue.destroy();
    if (npInterval) clearInterval(npInterval);
    consola.error(error)
    // await client.channels.cache.get(process.env.errorChannel).send({ content: `There was an error playing the track!`, embeds: [{ color: resolveColor("Red"), title: "Error", description: `${error.name}`, fields: [{ name: 'Message', value: `${error.message}` }, { name: 'Origin', value: `${error.stack}` }] }] })
})

client.login(process.env.TOKEN);