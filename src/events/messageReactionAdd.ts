import { EmbedBuilder, Events, Message, MessageReaction, TextChannel, User } from 'discord.js';
import consola from 'consola';
export default {
    name: Events.MessageReactionAdd,
    async execute(reaction: MessageReaction, user: User) {
        if (user.bot || reaction.message.author?.bot) return;
        if (reaction.partial) await reaction.fetch();
        if (reaction.emoji.name === '⭐') {
            if (user.id === reaction.message.author?.id) {
                reaction.users.remove(user.id);
                return reaction.message.reply({ content: "You poor thing! Don't go clout chasing by starring your own message, that doesn't help :(" });
            }
            try {
                addToStarboard(reaction, reaction.message as Message);
            } catch (err) {
                console.log(err);
            }
        }
    }
};
async function addToStarboard(reaction: MessageReaction, message: Message) {
    if (reaction.count < 3) return;
    if (reaction.message.channelId === WGChannels.starboard) return;
    if (reaction.message.partial) {
        reaction.message.fetch();
    }
    const starboard = reaction.message.guild?.channels.cache.get(WGChannels.starboard);
    if (!starboard) return;
    const fetch = await (starboard as TextChannel).messages.fetch({ limit: 100 });
    const stars = fetch.find((msg) => msg.embeds[0].footer?.text.startsWith(message.id));
    if (stars) {
        const starMessage = await (starboard as TextChannel).messages.fetch(stars.id);
        await starMessage.edit({ content: `${reaction.count < 5 ? '⭐' : '🌟'} ${reaction.count}  | ${message.channel}` });
    } else {
        consola.info(reaction.count);
        const embed = new EmbedBuilder()
            .setColor('Random')
            .setDescription(message.content || ' ')
            .setFields([{ name: 'Source', value: `[Jump to message](${message.url})` }])
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setFooter({ text: `${message.id}` })
            .setTimestamp();
        if (message.attachments.size > 0) {
            embed.setImage(message.attachments.first()!.proxyURL);
        }
        await (starboard as TextChannel).send({ content: `${reaction.count < 5 ? '⭐' : '🌟'} ${reaction.count}  | ${message.channel}`, embeds: [embed] });
    }
}
