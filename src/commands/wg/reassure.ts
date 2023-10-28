import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
let reassure = (await import('../../data/reassurance.json', { assert: { type: 'json' } })).default;

export const command = {
    data: new SlashCommandBuilder().setName('reassure').setDescription('Penny will reassure you'),
    category: "Writer's",
    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.channelId != WGChannels.prompts) {
            let reply = await interaction.reply({ content: `This command can only be used in <#${WGChannels.prompts}>.` });
            return setTimeout(async () => {
                await reply.delete();
            }, 10000);
        }
        let embed = new EmbedBuilder()
            .setColor('Gold')
            .setAuthor({ name: `Wise words from ${interaction.client.user.username}`, iconURL: interaction.client.user.displayAvatarURL() as string })
            .setTitle(reassure[Math.floor(Math.random() * reassure.length)])
            .setTimestamp();
        return interaction.reply({ embeds: [embed] });
    }
};
