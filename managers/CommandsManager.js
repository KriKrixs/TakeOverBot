import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { REST, Routes, Events, Collection} from 'discord.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url';

export default class CommandsManager {
    constructor(opt) {
        this.config = opt.config
        this.clients = opt.clients
    }

    async load() {
        this.clients.discord.getClient().commands = new Collection()

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const commands = []
        const commandsPath = path.join(__dirname, '/../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        console.log(commandFiles.length + " commands found.")

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = await import("file://" + filePath);
            // // Set a new item in the Collection with the key as the command name and the value as the exported module
            if (command.data !== undefined && command.execute !== undefined) {
                const data = command.data()

                console.log("Adding command /" + data.name)
                commands.push(data.toJSON())
                this.clients.discord.getClient().commands.set(data.name, command);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }

        const rest = new REST({ version: '10' }).setToken(this.config.discord.token);

        await rest.put(
            Routes.applicationCommands(this.config.discord.clientId),
            { body: commands },
        );

        const opt = this

        this.clients.discord.getClient().on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;

            const command = this.clients.discord.getClient().commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction, opt);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
            }
        });
    }
}