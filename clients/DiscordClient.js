/* Modules */
import { Client, GatewayIntentBits } from 'discord.js'

/**
 * DiscordClient class
 */
export default class DiscordClient {

    /**
     * DiscordClient's constructor
     * @param opt this of PlotBot object
     */
    constructor(opt) {
        this.config     = opt.config;
        this.loggers    = opt.loggers

        // Creating the client with the intent of fetching guilds
        this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages] });
    }

    /**
     * Log the discord client in
     */
    async loginClient() {
        try {
            await this.client.login(this.config.discord.token);
        } catch (e) {
            this.loggers.logger.log("CRITICAL", this.constructor.name, "Can't login to discord - " + e.message)
        }
    }

    /**
     * Get the discord client
     * @returns {Client<boolean>} Discord client
     */
    getClient() {
        return this.client;
    }
}
