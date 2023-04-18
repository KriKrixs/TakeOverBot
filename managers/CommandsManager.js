/* Modules */
import { REST, Routes, Events, Collection} from 'discord.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url';

/**
 * CommandsManager class
 */
export default class CommandsManager {

    /**
     * CommandsManager's constructor
     * @param opt this of PlotBot object
     */
    constructor(opt) {
        this.config     = opt.config
        this.clients    = opt.clients
        this.loggers    = opt.loggers
    }

    /**
     * Load every command in the commands folder
     * @returns Promise<bool> Don't care
     */
    async load() {
        // Creating a new collection of commands
        this.clients.discord.getClient().commands = new Collection()

        // Get the current directory
        const __filename    = fileURLToPath(import.meta.url);
        const __dirname     = path.dirname(__filename);

        // Fetch the commands files
        const commands      = []
        const commandsPath  = path.join(__dirname, '/../commands');
        const commandFiles  = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        await this.loggers.logger.log("INFO", this.constructor.name, commandFiles.length + " commands found.")

        for (const file of commandFiles) {
            // Store the file path
            const filePath = path.join(commandsPath, file);

            let command

            // Import the command (If running on Windows, add the mandatory "file://")
            try {
                command = await import((process.platform === "win32" ? "file://" : "") + filePath);
            } catch (e) {
                await this.loggers.logger.log("CRITICAL", this.constructor.name, "Can't import '" + filePath + "' - " + e.message)
                return false
            }

            // If the command have the required functions data and execute
            if (command.data !== undefined && command.execute !== undefined) {
                const data = command.data()

                await this.loggers.logger.log("INFO", this.constructor.name, "Adding command /" + data.name)

                // Push the command's data into the array of commands
                commands.push(data.toJSON())

                // Set the command into the collection of commands
                await this.clients.discord.getClient().commands.set(data.name, command);
            } else {
                await this.loggers.logger.log("WARNING", this.constructor.name, "The command at '" + filePath + "' is missing the required 'data' and 'execute' functions")
            }
        }

        // Preparing the REST API object to push the commands globally
        const rest = new REST({ version: '10' }).setToken(this.config.discord.token);

        // Push the commands globally
        try {
            await rest.put(
                Routes.applicationCommands(this.config.discord.clientId),
                { body: commands },
            );
        } catch (e) {
            await this.loggers.logger.log("CRITICAL", this.constructor.name, "Can't push the commands globally - " + e.message)
        }

        // Required to pass the current this to the commands
        const opt = this

        // When a user is using a command
        this.clients.discord.getClient().on(Events.InteractionCreate, async interaction => {
            await this.loggers.logger.log("INFO", this.constructor.name, "User '" + interaction.user.username + "' executed the command '" + interaction.commandName + "'")

            if (!interaction.isChatInputCommand())
                return

            // Retrieve the command by its name
            const command = this.clients.discord.getClient().commands.get(interaction.commandName);

            if (!command)
                return this.loggers.logger.log("WARNING", this.constructor.name, "No command matching '" + interaction.commandName + "' was found")

            try {
                await command.execute(interaction, opt);
            } catch (e) {
                await this.loggers.logger.log("WARNING", this.constructor.name, "Error while executing the command '" + interaction.commandName + "' - " + e.message)
            }
        });

        return true
    }
}