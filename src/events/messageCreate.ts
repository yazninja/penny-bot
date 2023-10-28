import { EmbedBuilder, Events, Message } from 'discord.js';
import consola from 'consola';
let prompts = (await import('../data/prompts.json', { assert: { type: 'json' } })).default;
let reassure = (await import('../data/reassurance.json', { assert: { type: 'json' } })).default;
export default {
    name: Events.MessageCreate,
    once: false,
    async execute(message: Message) {
        if (message.author.bot) return;
        const client = message.client;
        if (message.content === '!prompt') {
            if (message.channelId != WGChannels.prompts) {
                let reply = await message.reply({ content: `This command can only be used in <#${WGChannels.prompts}>.` });
                return setTimeout(async () => {
                    await message.delete();
                    await reply.delete();
                }, 10000);
            }
            let embed = new EmbedBuilder()
                .setColor('Gold')
                .setAuthor({ name: `Writing Prompts from ${message.client.user.username}`, iconURL: message.client.user.displayAvatarURL() as string })
                .setTitle(prompts[Math.floor(Math.random() * prompts.length)])
                .setDescription(`You can also use </prompt:${WGCommands.prompt}>`)
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        } else if (message.content == '!reassure') {
            if (message.channelId != WGChannels.reassurance) {
                let reply = await message.reply({ content: `This command can only be used in <#${WGChannels.reassurance}>.` });
                return setTimeout(async () => {
                    await message.delete();
                    await reply.delete();
                }, 10000);
            }
            let embed = new EmbedBuilder()
                .setColor('Gold')
                .setAuthor({ name: `Wise words from ${message.client.user.username}`, iconURL: message.client.user.displayAvatarURL() as string })
                .setTitle('*' + reassure[Math.floor(Math.random() * reassure.length)] + '*')
                .setDescription(`You can also use </reassure:${WGCommands.reassure}>`)
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }
    }
};
