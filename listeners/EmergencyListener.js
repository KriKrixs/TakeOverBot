export default class EmergencyListener {
    constructor(opt) {
        this.config     = opt.config
        this.clients    = opt.clients
        this.loggers    = opt.loggers
        this.utils      = opt.utils

        this.emergencyBotMessageId = null
    }

    async emergency(packet) {
        const data = packet.d;

        if(data["channel_id"] === this.config.ids.channels.emergency && data.author.id !== this.config.ids.users.bot) {
            const interval = new Date(Date.now() - this.config.listeners.emergency.latestEmergencyMessageInterval * 60 * 1000);

            await this.clients.mongo.createIndex("emergencyMessages", "createdAt")

            const latestEmergencyMessages = await this.clients.mongo.findDocuments("emergencyMessages", {
                createdAt: { $gte: interval },
            })

            if(Array.from(latestEmergencyMessages).length === 0) {
                const guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
                const channel = guild.channels.cache.get(this.config.ids.channels.emergency)

                const botMessage = await channel.send("" +
                    "- Réagissez avec :white_check_mark: si il s'agit d'une urgence immédiate (Panne sur bord de route, accidents, aide urgente)\n" +
                    "- Réagissez avec :x: si ce n'est pas le cas et de vous tournez vers <#" + this.config.ids.channels.aideMeca + ">"
                );

                botMessage.react('✅')
                botMessage.react('❌')

                const userMessage = await channel.messages.fetch(data.id)

                const afkTimeout = setTimeout(() => {
                    botMessage.delete()
                    userMessage.delete()

                    this.emergencyBotMessageId = null;
                }, this.config.listeners.emergency.waitingReactionsTimeout * 60000)

                this.emergencyBotMessageId = { botMessage, userMessage, afkTimeout }
            }
        }
    }

    async emergencyReaction(packet) {
        const data = packet.d;

        if(this.emergencyBotMessageId !== null && data["message_id"] === this.emergencyBotMessageId.botMessage.id && data["user_id"] !== this.config.ids.users.bot) {
            if(data.emoji.name === "✅") {
                await this.clients.mongo.insertDocuments("emergencyMessages", [{ createdAt: new Date() }])

                clearTimeout(this.emergencyBotMessageId.afkTimeout)

                const guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
                const channel = guild.channels.cache.get(this.config.ids.channels.emergency)

                channel.send("@everyone")

                this.emergencyBotMessageId.botMessage.delete()

                this.emergencyBotMessageId = null;
            }

            if(data.emoji.name === "❌") {
                clearTimeout(this.emergencyBotMessageId.afkTimeout)

                this.emergencyBotMessageId.botMessage.delete()
                this.emergencyBotMessageId.userMessage.delete()

                this.emergencyBotMessageId = null;
            }
        }
    }
}