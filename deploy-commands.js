import 'dotenv/config';
import { readdirSync } from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';

const commands = [];

const commandFolders = readdirSync('./src/commands/');
for (const folder of commandFolders) {
    const commandFiles = readdirSync(`./build/commands/${folder}`).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        const { command } = await import(`./build/commands/${folder}/${file}`);
        commands.push(command.data);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
try {
    console.log('Started refreshing application (/) commands.', commands.map((c) => c.name).join(', '));

    let test = await rest.put(Routes.applicationCommands(process.env.DISCORD_ID, process.env.CiderGuild), { body: commands });
    console.log(test.map((c) => c.name + '- ' + c.id).join('\n'));
    console.log('Successfully reloaded application (/) commands.\n' + commands.map((c) => c.name).join(', '));
} catch (error) {
    console.error(error);
}
