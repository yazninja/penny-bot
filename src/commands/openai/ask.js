import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import consola from 'consola';
export const command = {
    data: new SlashCommandBuilder()
        .setName("ask")
        .setDescription("Ask OpenAI ChatGPT a question")
        .addStringOption(option => option.setName("question").setDescription("The question to ask").setRequired(true))
        .addBooleanOption(option => option.setName("show").setDescription("Show to everyone!").setRequired(false))
        .addBooleanOption(option => option.setName("end-after").setDescription("End the conversation after response").setRequired(false)),
    category: 'AI',
    execute: async (interaction) => {
        let { client } = await import('../../index.js');
        let show = interaction.options.getBoolean('show') || false;
        if(interaction.channelId == process.env.OPENAI_CHANNEL && interaction.options.getBoolean('show') != false) show = true;
        await interaction.deferReply({ ephemeral: !show }); 
        if(show && interaction.channelId != process.env.OPENAI_CHANNEL && !interaction.member.roles.cache.has(process.env.DEVELOPER)) {
            await interaction.editReply({ content: `You do not have permission to use this command in this channel\nDisable the \`show\` flag or use the <#${process.env.OPENAI_CHANNEL}> channel` });
            return setTimeout(() => {
                interaction.deleteReply();
            }, 20000);
        }
        let prompt = interaction.options.getString('question');
        prompt = prompt.charAt(0).toUpperCase() + prompt.slice(1);
        console.log(prompt);

        let response;
        try {
            if(client.chatSessions.has(interaction.user.id)) response = await client.chatbot.send(client.accessToken, prompt, client.chatSessions.get(interaction.user.id).split("+")[0], client.chatSessions.get(interaction.user.id).split("+")[1]);
            else response = await client.chatbot.send(client.accessToken, prompt, null);
            consola.info(response)
        } catch (error) {
            consola.error(error);
            await interaction.editReply({ content: "Invalid Response, Try Again Later", ephemeral: true });
            return await interaction.followUp({ content: error.message, ephemeral: true });
        }
        if (interaction.options.getBoolean('endAfter') && client.chatSessions.has(interaction.user.id)) client.chatSessions.delete(interaction.user.id);
        if (!interaction.options.getBoolean('endAfter')) client.chatSessions.set(interaction.user.id, `${response.conversationId}+${response.id}`);
        if(prompt.length > 256) prompt = prompt.slice(0, 252) + "...";
        let embed = new EmbedBuilder()
            .setAuthor({ name: "OpenAI ChatGPT", iconURL: client.openAILogo })
            .setTitle(prompt)
            .setDescription(response.message)
            .setColor("Gold")
            .setFooter({ text: `Requested by ${interaction.user.tag} | ${response.id.split("-")[0]}`, iconURL: interaction.user.avatarURL() })
            .addFields({ name: "Conversation ID", value: `${response.conversationId}`, inline: true })
            .setTimestamp()
        
        return await interaction.editReply({ embeds: [embed], ephemeral: !show }); 
    }
}