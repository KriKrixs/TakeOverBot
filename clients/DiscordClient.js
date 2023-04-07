import { Client, GatewayIntentBits } from 'discord.js'

export default class DiscordClient {

    constructor(opt) {
        this.config = opt.config;
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
    }

    loginClient() {
        this.client.login(this.config.discord.token);
    }

    getClient() {
        return this.client;
    }

}