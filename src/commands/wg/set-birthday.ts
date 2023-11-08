import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, TextChannel } from 'discord.js';
import { kv } from '@vercel/kv';

export const command = {
    data: new SlashCommandBuilder()
        .setName('set-birthday')
        .setDescription('Set your birthday, so Penny can wish you a happy birthday on that day')
        .addStringOption((option) => option.setName('date').setDescription('Your birthday').setRequired(true))
        .addStringOption((option) => option.setName('timezone').setDescription('Your timezone').setRequired(true).setAutocomplete(true)),

    category: "Writer's",
    async autocomplete(interaction: AutocompleteInteraction) {
        let query = interaction.options.getFocused();
        return interaction.respond(
            Intl.supportedValuesOf('timeZone')
                .filter((timezone: string) => timezone.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 20)
                .map((timezone: string) => {
                    return {
                        name: timezone,
                        value: timezone
                    };
                })
        );
    },
    async execute(interaction: ChatInputCommandInteraction) {
        let dateString = interaction.options.getString('date', true);
        let timezoneString = interaction.options.getString('timezone', true);
        if (isNaN(Date.parse(dateString))) {
            return interaction.reply({ content: 'Invalid date', ephemeral: true });
        }

        if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone || !(typeof timezoneString === 'string')) {
            return interaction.reply({
                content: 'Invalid timezone provided. Refer to the supported timezones.',
                //@ts-ignore
                components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL('https://kevinnovak.github.io/Time-Zone-Picker/').setLabel('Time Zone Picker'))],
                ephemeral: true
            });
        }
        // new date given string and timezone
        let date = new Date(new Date(dateString).toLocaleString('en-US', { timeZone: timezoneString }));
        kv.sadd(`WG_birthday_${date.getUTCMonth() + 1}-${date.getUTCDate()}:${date.getUTCHours()}`, interaction.user.id);

        let embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle(`Your Birthday set!`)
            .setDescription(`Success!, Your birthday has been set to **${engDate(date)}, ${timezoneString}**.\n\nIf you want to change your birthday, use </set-birthday:${WGCommands.setBirthday}>`);
        await interaction.reply({ embeds: [embed] });
    }
};
function engDate(date: Date): String {
    switch (date.getMonth()) {
        case 0:
            return `January ${date.getDate()}`;
        case 1:
            return `February ${date.getDate()}`;
        case 2:
            return `March ${date.getDate()}`;
        case 3:
            return `April ${date.getDate()}`;
        case 4:
            return `May ${date.getDate()}`;
        case 5:
            return `June ${date.getDate()}`;
        case 6:
            return `July ${date.getDate()}`;
        case 7:
            return `August ${date.getDate()}`;
        case 8:
            return `September ${date.getDate()}`;
        case 9:
            return `October ${date.getDate()}`;
        case 10:
            return `November ${date.getDate()}`;
        case 11:
            return `December ${date.getDate()}`;
        default:
            return `Invalid Date`;
    }
}
