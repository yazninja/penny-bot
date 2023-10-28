import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
let prompts = (await import('../../data/prompts.json', { assert: { type: 'json' } })).default;

export const command = {
    data: new SlashCommandBuilder().setName('prompt').setDescription('Get a random writing prompt'),
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
            .setAuthor({ name: `Writing Prompts from ${interaction.client.user.username}`, iconURL: interaction.client.user.displayAvatarURL() as string })
            .setTitle(prompts[Math.floor(Math.random() * prompts.length)])
            .setTimestamp();
        return interaction.reply({ embeds: [embed] });
    }
};
