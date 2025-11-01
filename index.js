/* Sentry */
import * as Sentry from "@sentry/node";

/* Modules */
import { Events, ActivityType } from "discord.js"
import 'dotenv/config'

/* Clients */
import DiscordClient from "./clients/DiscordClient.js"
import MongoDBClient from "./clients/MongoDBClient.js"

/* Managers */
import CommandsManager from "./managers/CommandsManager.js"

/* Loggers */
import Logger from "./loggers/Logger.js"

/* Utils */
import Embed from "./utils/Embed.js"
import ListenersManager from "./managers/ListenersManager.js";
import InstagramWatcher from "./watchers/InstagramWatcher.js";
import YouTubeWatcher from "./watchers/YouTubeWatcher.js";
import RolesListener from "./listeners/RolesListener.js";

/**
 * TakeOverBot class
 */
class TakeOverBot {

    /**
     * TakeOverBot's constructor
     */
    constructor() {
        if(process.env.SENTRY_ENABLE === "true") {
            Sentry.init({ dsn: process.env.SENTRY_DSN });
        }

        this.loggers    = {
            logger: new Logger()
        }

        this.clients    = {
            discord : new DiscordClient(this),
            mongo   : new MongoDBClient(this),
        }

        this.utils      = {
            Embed: new Embed()
        }

        this.listeners = {
            roles: new RolesListener(this)
        }

        this.managers   = {
            commands: new CommandsManager(this),
            listeners: new ListenersManager(this),
        }

        this.watchers   = {
            instagram: new InstagramWatcher(this),
            youtube: new YouTubeWatcher(this),
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
        await this.clients.mongo.loginClient()

        // When the discord client is ready
        this.clients.discord.getClient().once(Events.ClientReady, async () => {
            await this.loggers.logger.log("INFO", this.constructor.name, "Discord is ready")

            // Set the presence activity
            this.clients.discord.getClient().user.setPresence({
                activities: [{ name: 'vos caisses', type: ActivityType.Watching }]
            })

            await this.listeners.roles.updateWebRoles();

            // Load all the commands
            await this.managers.commands.load()

            setInterval(async () => {
                await this.watchers.instagram.getLastPost();

                for (const playlistId of Array.from(process.env.WATCHERS_YOUTUBE_PLAYLISTIDS)) {
                     await this.watchers.youtube.getLastVideo(playlistId);
                }
            }, process.env.WATCHERS_INTERVAL)

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
