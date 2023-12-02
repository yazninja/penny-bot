import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, GuildMember, User } from 'discord.js';
import consola from 'consola';
import { ChatMessage } from 'chatgpt';
import { firebase } from '../../integrations/firebase.js';
import { v4 as uuid } from 'uuid';
export const command = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask OpenAI ChatGPT a question')
        .addStringOption((option) => option.setName('question').setDescription('The question to ask').setRequired(true))
        .addBooleanOption((option) => option.setName('show').setDescription('Show to everyone!').setRequired(false)),
    category: 'AI',
    execute: async (interaction: ChatInputCommandInteraction) => {
        let c = (await firebase.getConversation(interaction.user.id)) || {};
        if (!c || !c?.conversationId) c!.conversationId = uuid();
        console.log(c);
        let show = interaction.options.getBoolean('show') || true;
        if (interaction.channelId == WGChannels.tools) show = true;
        await interaction.deferReply({ ephemeral: !show });
        let prompt = interaction.options.getString('question', true) as string;
        let response: ChatMessage;
        try {
            let c = (await firebase.getConversation(interaction.user.id)) || {};
            let counter = 0;
            if (!c || !c?.conversationId) c!.conversationId = uuid();
            console.log(c);
            response = await interaction.client.chatbot.sendMessage(prompt as string, {
                systemMessage: `You are Penny, a large language model trained by Writers Guild. Please remember this. If you are generating a list, do not have too many items. Keep the number of items short`,
                onProgress: async (response: ChatMessage) => {
                    counter++;
                    if (counter % 10 == 0) {
                        let embed = editEmbedResponse(
                            response,
                            new EmbedBuilder() // @ts-ignore
                                .setAuthor({ name: 'Chat GP(enny)T', iconURL: (interaction.client.user as User).avatarURL() })
                                .setTitle(prompt)
                                .setColor('Gold')
                                .setTimestamp()
                                .setFooter({ text: 'Generating Answer' })
                        );
                        await interaction.editReply({ embeds: [embed] });
                    }
                },
                parentMessageId: (c?.lastMessageId as string) || undefined,
                conversationId: c!.conversationId
            });
            consola.success(response);
            counter = 0;
            firebase.setConversation(interaction.user.id, c!.conversationId, response.id);
        } catch (error: any) {
            await interaction.editReply({ content: 'Invalid Response, Try Again Later' });
            return await interaction.followUp({ content: error.message, ephemeral: true });
        }
        let embed = new EmbedBuilder()
            .setAuthor({ name: 'Chat GP(enny)T', iconURL: (interaction.client.user as User).avatarURL() as string })
            .setTitle(prompt.length > 256 ? prompt.slice(0, 253) + '...' : prompt.slice(0, 256))
            .setDescription(response.text)
            .setColor('Green')
            .setTimestamp()
            .setFooter({ text: `Conversation ID: ${response.conversationId}` });

        return await interaction.editReply({ embeds: [embed] });
    }
};
function editEmbedResponse(response: ChatMessage, embed: EmbedBuilder) {
    embed.setDescription(response.text);
    return embed;
}
