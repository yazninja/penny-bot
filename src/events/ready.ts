import { ActivityType, Client, EmbedBuilder, Events, Guild, TextChannel } from 'discord.js';
import consola from 'consola';
import { getAPIToken } from '../integrations/musickitAPI.js';
import { kv } from '@vercel/kv';
import { playerEvents } from '../integrations/discord-player.js';
let birthdayGreetings = (await import('../data/birthdays.json', { assert: { type: 'json' } })).default;
export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client<true>) {
        client.amAPIToken = await getAPIToken();
        consola.success(`Logged in as ${client.user.tag}`);
        client.user.setActivity('Starting up...', { type: ActivityType.Playing });
        playerEvents(client.player);
        if (process.env.NODE_ENV === 'development') return client.user.setPresence({ activities: [{ name: '⚙️ in development' }], status: 'idle' });
        let guild = client.guilds.cache.get(WGServers.main);
        try {
            await (client.channels.cache.get(WGChannels.botLog) as TextChannel).send({ embeds: [{ description: `<t:${Math.floor(Date.now() / 1000)}:R> | **${client.user.username} has started up!**`, color: 0x00ff00 }] });
            client.user.setActivity('Writers Guild', { type: ActivityType.Watching });
            happyBirthday(new Date(), guild as Guild);
            setInterval(() => {
                happyBirthday(new Date(), guild as Guild);
            }, 60000);
        } catch (error) {
            consola.error(error);
        }
    }
};
function tryMessage(client: Client<true>) {
    (client.guilds.cache.get('1096549114013028424')?.channels.cache.get('1096549114885447829') as TextChannel).send('Test - yaz');
}
async function happyBirthday(date: Date, guild: Guild) {
    let month = date.getUTCMonth() + 1;
    let day = date.getUTCDate();
    let hour = date.getUTCHours();
    if ((await kv.keys(`WG_birthday_${month}-${day}:${hour}`)).length === 0) return;

    let users = await kv.smembers(`WG_birthday_${month}-${day}:${hour}`);
    let channel = guild.channels.cache.get(WGChannels.birthdays) as TextChannel;

    for (let user of users) {
        let embed = new EmbedBuilder()
            .setColor(guild.members.cache.get(user)?.displayColor || 'Random')
            .setDescription(birthdayGreetings[Math.floor(Math.random() * birthdayGreetings.length)].replace('$USER', `<@${user}>`))
            .setTimestamp();

        channel.send({ content: `<@${user}> :birthday:`, embeds: [embed] });
    }
}
