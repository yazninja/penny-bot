import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, TextChannel } from 'discord.js';
import { kv } from '@vercel/kv';

export const command = {
    data: new SlashCommandBuilder()
        .setName('freedom')
        .setDescription("Post something on WG's freedom wall")
        .addStringOption((option) => option.setName('post').setDescription('post text').setRequired(true)),
    category: "Writer's",
    async execute(interaction: ChatInputCommandInteraction) {
        let confession = interaction.options.getString('post', true);
        let confessionCount = (await kv.get<number>('WG_confessionCount')) || 0;
        let embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`WG Freedom Post (#${confessionCount})`)
            .setDescription(`"${confession}"`)
            .setFields([{ name: ' ', value: `Use </freedom:${WGCommands.freedom}> to post your own messages anonymously.` }])
            .setFooter({ text: `If this post is ToS-breaking or overtly hateful, please report it using "/report freedom ${confessionCount}"` });
        await interaction.reply({ content: 'Your confession has been sent!', ephemeral: true });
        await (interaction.guild?.channels.cache.get(WGChannels.freedomWall) as TextChannel).send({ embeds: [embed] });
        await kv.set('WG_confessionCount', confessionCount + 1);
    }
};
