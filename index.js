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
            console.log("Init Sentry");

            Sentry.init({
                dsn: process.env.SENTRY_DSN,
                serverName: process.env.SENTRY_SERVER_NAME,
                debug: process.env.SENTRY_DEBUG === "true",
                beforeSend(event) {
                    if(process.env.SENTRY_DEBUG === "true") {
                        console.log("Sending event to Sentry:", event.event_id);
                    }
                    return event;
                },
            });
        }

        this.loggers    = {
            logger: new Logger(Sentry)
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

        // Login the discord & mongo client
        await this.clients.discord.loginClient()
        await this.clients.mongo.loginClient()
    }
}

try {
    // Create a new instance of the discord bot
    new TakeOverBot()
} catch (e) {
    console.error(e);
}

// ⚠️ Capture + flush + exit pour TOUTE erreur non gérée
const fatal = async (err, code = 1) => {
    // err peut être un string / objet -> normaliser
    const error = err instanceof Error ? err : new Error(String(err));
    Sentry.captureException(error);
    try { await Sentry.flush(5000); } catch {}
    process.exit(code);
};

process.on('uncaughtException', (err) => fatal(err, 1));
process.on('unhandledRejection', (reason) => fatal(reason, 1));

// (optionnel) quand on reçoit un SIGTERM/SIGINT (Docker stop, Ctrl+C)
const graceful = async (code = 0) => {
    try { await Sentry.flush(3000); } catch {}
    process.exit(code);
};
process.on('SIGTERM', () => graceful(0));
process.on('SIGINT',  () => graceful(0));
