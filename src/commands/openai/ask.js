import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName("ask")
        .setDescription("Ask OpenAI ChatGPT a question")
        .addStringOption(option => option.setName("question").setDescription("The question to ask").setRequired(true))
        .addBooleanOption(option => option.setName("show").setDescription("Show to everyone!").setRequired(false)),
    category: 'Writer',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        let show = interaction.options.getBoolean('show') || false;
        if(interaction.channelId == process.env.OPENAI_CHANNEL) show = true;
        interaction.deferReply({ ephemeral: !show });
        let prompt = interaction.options.getString('question');
        let response;
        try {
            response = await client.chatbot.ask(prompt);
        } catch {
            await interaction.editReply({ content: "404", ephemeral: true });
            return await interaction.followUp({ content: "OpenAI Servers have failed to give a valid response", ephemeral: true });
        }
        
        let embed = new EmbedBuilder()
            .setAuthor({ name: "OpenAI ChatGPT", iconURL: client.user.avatarURL()})
            .setTitle(prompt)
            .setDescription(response)
            .setColor("Gold")
            .setTimestamp()
        await interaction.editReply({ embeds: [embed], ephemeral: !show }); 
    }
}