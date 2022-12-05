import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import consola from 'consola';
export const command = {
    data: new SlashCommandBuilder()
        .setName("ask")
        .setDescription("Ask OpenAI ChatGPT a question")
        .addStringOption(option => option.setName("question").setDescription("The question to ask").setRequired(true))
        .addBooleanOption(option => option.setName("show").setDescription("Show to everyone!").setRequired(false)),
    category: 'AI',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        let show = interaction.options.getBoolean('show') || false;
        if(interaction.channelId == process.env.OPENAI_CHANNEL) show = true;
        await interaction.deferReply({ ephemeral: !show }); 
        if(show && interaction.channelId != process.env.OPENAI_CHANNEL && !interaction.member.roles.cache.has(process.env.DEVELOPER)) {
            await interaction.editReply({ content: `You do not have permission to use this command in this channel\nDisable the \`show\` flag or use the <#${process.env.OPENAI_CHANNEL}> channel` });
            return setTimeout(() => {
                interaction.deleteReply();
            }, 20000);
        }
        let prompt = interaction.options.getString('question');
        let response;
        try {
            response = await client.chatbot.ask(prompt);
        } catch (error) {
            consola.error(error);
            await interaction.editReply({ content: "Invalid Response, Try Again Later", ephemeral: true });
            return await interaction.followUp({ content: error.message, ephemeral: true });
        }
        let embed = new EmbedBuilder()
            .setAuthor({ name: "OpenAI ChatGPT", iconURL: client.user.avatarURL()})
            .setTitle(prompt)
            .setDescription(response)
            .setColor("Gold")
            .setTimestamp()
        
        return await interaction.editReply({ embeds: [embed], ephemeral: !show }); 
    }
}