import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, GuildMember, User } from 'discord.js';
import consola from 'consola';
import { firebase } from '../../integrations/firebase.js';
export const command = {
    data: new SlashCommandBuilder()
        .setName("resetconvo")
        .setDescription("Reset your conversation with OpenAI ChatGPT"),
    category: 'AI',
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ ephemeral: true });
        try {
            await firebase.resetConversation(interaction.user.id);
        } catch (error : any) {
            consola.error(error);
            await interaction.editReply({ content: "Invalid Response, Try Again Later"});
            return await interaction.followUp({ content: error.message, ephemeral: true });
        }
        await interaction.editReply({ content: "Conversation Reset" });
    }
}