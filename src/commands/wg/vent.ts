import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, TextChannel } from 'discord.js';
import { kv } from '@vercel/kv';

export const command = {
    data: new SlashCommandBuilder()
        .setName('vent')
        .setDescription('Vent your frustrations anonymously')
        .addStringOption((option) => option.setName('vent').setDescription('Type your worries away').setRequired(true)),
    category: "Writer's",
    async execute(interaction: ChatInputCommandInteraction) {
        let vent = interaction.options.getString('vent', true);
        let ventCount = (await kv.get<number>('WG_ventCount')) || 0;
        let embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`Anonymous Vent (#${ventCount})`)
            .setDescription(`"${vent}"`)
            .setFields([{ name: ' ', value: `Use </vent:${WGCommands.vent}> to post your own messages anonymously.` }])
            .setFooter({ text: `If this post is ToS-breaking or overtly hateful, please report it using "/report vent ${ventCount}"` });
        await interaction.reply({ content: 'Your confession has been sent!', ephemeral: true });
        await (interaction.guild?.channels.cache.get(WGChannels.ventWall) as TextChannel).send({ embeds: [embed] });
        await kv.set('WG_ventCount', ventCount + 1);
    }
};
