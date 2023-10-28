import { BaseInteraction, Events } from 'discord.js';

export default {
    name: Events.InteractionCreate,
    once: false,
    execute(interaction: BaseInteraction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                command.execute(interaction);
            } catch (error) {
                console.error(error);
                interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        } else if(interaction.isModalSubmit()) {
            console.log(interaction.customId)
            const command = interaction.client.commands.get(interaction.customId);
            if (!command) return;
            try {
                command.recieve(interaction);
            }
            catch (error) {
                console.error(error);
            }
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                command.autocomplete(interaction);
            }
            catch (error) {
                console.error(error);
            }
        }
    }
};
