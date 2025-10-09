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
        this.loggers    = opt.loggers

        // Creating the client with the intent of fetching guilds
        this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions] });
    }

    /**
     * Log the discord client in
     */
    async loginClient() {
        try {
            await this.client.login(process.env.DISCORD_TOKEN);
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
