/* Modules */
import { Events, ActivityType } from "discord.js"

/* Clients */
import DiscordClient from "./clients/DiscordClient.js"
import MongoDBClient from "./clients/MongoDBClient.js"
import SteamClient from "./clients/SteamClient.js"

/* Managers */
import CommandsManager from "./managers/CommandsManager.js"

/* Loggers */
import Logger from "./loggers/Logger.js"

/* Config */
import config from "./config.json" with {"type": "json"}

/* Utils */
import Embed from "./utils/Embed.js"
import ListenersManager from "./managers/ListenersManager.js";

/**
 * TakeOverBot class
 */
class TakeOverBot {

    /**
     * TakeOverBot's constructor
     */
    constructor() {
        this.config     = config

        this.loggers    = {
            logger: new Logger(this)
        }

        this.clients    = {
            discord : new DiscordClient(this),
            mongo   : new MongoDBClient(this),
            steam   : new SteamClient(this)
        }

        this.utils      = {
            Embed: new Embed()
        }

        this.managers   = {
            commands: new CommandsManager(this),
            listeners: new ListenersManager(this),
        }

        this.init()
    }

    /**
     * Initialize the bot
     * @returns {Promise<void>}
     */
    async init() {
        await this.loggers.logger.log("INFO", this.constructor.name, "Starting the bot")

        // Login the discord & mongo client
        await this.clients.discord.loginClient()
        // await this.clients.mongo.loginClient()

        // When the discord client is ready
        this.clients.discord.getClient().once(Events.ClientReady, async () => {
            await this.loggers.logger.log("INFO", this.constructor.name, "Discord is ready")

            // Set the presence activity
            this.clients.discord.getClient().user.setPresence({
                activities: [{ name: 'vos caisses', type: ActivityType.Watching }]
            })

            // Load all the commands
            await this.managers.commands.load()

            await this.loggers.logger.log("INFO", this.constructor.name, "Bot is up!")
        })

        this.clients.discord.getClient().on('raw', async packet => {
            await this.managers.listeners.listen(packet);
        })
    }
}

try {
    // Create a new instance of the discord bot
    new TakeOverBot()
} catch (e) {
    console.error(e);
}
