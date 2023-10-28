import { EmbedBuilder, Events, GuildMember, TextChannel } from 'discord.js';
let welcome = (await import('../data/welcome.json', { assert: { type: 'json' } })).default;

export default {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member: GuildMember) {
        const channel = member.guild.channels.cache.get(WGChannels.welcome) as TextChannel;
        const newEmbed = new EmbedBuilder()
            .setColor(member.user.hexAccentColor || 'Random')
            .setAuthor({
                name: `Welcome to ${member.guild.name}!`,
                iconURL: member.client.user.displayAvatarURL()
            })
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(`I am Penny and welcome to the server, <@${member.user.id}>. Please read the rules and regulations in <#${WGChannels.rules}> and introduce yourselves in <#${WGChannels.introduction}>!`)
            .setFooter({ text: welcome[Math.floor(Math.random() * welcome.length)], iconURL: member.guild.iconURL() || member.client.user.displayAvatarURL() });
        await channel.send({ embeds: [newEmbed] });
    }
};
