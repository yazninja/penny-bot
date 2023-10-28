import { ActivityType, Client, Events, Guild, TextChannel } from 'discord.js';
import consola from 'consola';
import { getAPIToken } from '../integrations/musickitAPI.js';
import { kv } from '@vercel/kv';
import { playerEvents } from '../integrations/discord-player.js';
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
        } catch (error) {
            consola.error(error);
        }
    }
};
