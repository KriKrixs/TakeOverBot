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
            this.loggers.logger.log("INFO", this.constructor.name, "Attempting discord login")

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Discord login timed out')), process.env.DISCORD_LOGIN_TIMEOUT)
            );

            const loginPromise = this.client.login(process.env.DISCORD_TOKEN);

            await Promise.race([loginPromise, timeoutPromise]);

            this.loggers.logger.log("INFO", this.constructor.name, "Discord successfully logged in")
        } catch (e) {
            this.loggers.logger.log("CRITICAL", this.constructor.name, "Can't login to discord - " + e.message, e, true)
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
