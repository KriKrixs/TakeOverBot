import { ActivityType, Events } from "discord.js"
import DiscordClient from "./clients/DiscordClient.js"
import MongoDBClient from "./clients/MongoDBClient.js"
import CommandsManager from "./managers/CommandsManager.js"
import SteamClient from "./clients/SteamClient.js";
import TrackerNetworkClient from "./clients/TrackerNetworkClient.js";
import config from "./config.json" assert {"type": "json"}

class PlotBot {
    constructor() {
        // Déclaration de la configuration

        this.config = config

        // Instanciation des clients

        this.clients = {
            discord: new DiscordClient(this),
            mongo: new MongoDBClient(this),
            steam: new SteamClient(this),
            trackerNetwork: new TrackerNetworkClient(this)
        };

        // Instanciation des managers

        this.managers = {
            commands: new CommandsManager(this)
        }

        // Initialisation du bot

        this.init()
    }

    async init() {
        this.clients.discord.loginClient();
        await this.clients.mongo.loginClient();

        this.clients.discord.getClient().once(Events.ClientReady, async () => {
            console.log("Discord: Ready.");

            await this.clients.discord.getClient().user.setPresence({
                activities: [{ name: 'les plots jouer', type: ActivityType.Watching }]
            });

            await this.managers.commands.load()
        });
    }

}

new PlotBot();