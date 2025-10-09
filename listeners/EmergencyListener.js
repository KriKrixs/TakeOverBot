export default class EmergencyListener {
    constructor(opt) {
        this.clients    = opt.clients
        this.loggers    = opt.loggers
        this.utils      = opt.utils

        this.emergencyBotMessageId = null
    }

    async emergency(packet) {
        const data = packet.d;

        if(data["channel_id"] === process.env.IDS_CHANNELS_EMERGENCY && data.author.id !== process.env.IDS_USERS_BOT) {
            const interval = new Date(Date.now() - process.env.LISTENERS_EMERGENCY_LATESTEMERGENCYMESSAGEINTERVAL * 60 * 1000);

            await this.clients.mongo.createIndex("emergencyMessages", "createdAt")

            const latestEmergencyMessages = await this.clients.mongo.findDocuments("emergencyMessages", {
                createdAt: { $gte: interval },
            })

            if(Array.from(latestEmergencyMessages).length === 0) {
                const guild = this.clients.discord.getClient().guilds.cache.get(process.env.IDS_GUILD)
                const channel = guild.channels.cache.get(process.env.IDS_CHANNELS_EMERGENCY)

                const botMessage = await channel.send("" +
                    "- Réagissez avec :white_check_mark: si il s'agit d'une urgence immédiate (Panne sur bord de route, accidents, aide urgente)\n" +
                    "- Réagissez avec :x: si ce n'est pas le cas et de vous tournez vers <#" + process.env.IDS_CHANNELS_AIDEMECA + ">"
                );

                botMessage.react('✅')
                botMessage.react('❌')

                const userMessage = await channel.messages.fetch(data.id)

                const afkTimeout = setTimeout(() => {
                    botMessage.delete()
                    userMessage.delete()

                    this.emergencyBotMessageId = null;
                }, process.env.LISTENERS_EMERGENCY_WAITINGREACTIONSTIMEOUT * 60000)

                this.emergencyBotMessageId = { botMessage, userMessage, afkTimeout }
            }
        }
    }

    async emergencyReaction(packet) {
        const data = packet.d;

        if(this.emergencyBotMessageId !== null && data["message_id"] === this.emergencyBotMessageId.botMessage.id && data["user_id"] !== process.env.IDS_USERS_BOT) {
            if(data.emoji.name === "✅") {
                await this.clients.mongo.insertDocuments("emergencyMessages", [{ createdAt: new Date() }])

                clearTimeout(this.emergencyBotMessageId.afkTimeout)

                const guild = this.clients.discord.getClient().guilds.cache.get(process.env.IDS_GUILD)
                const channel = guild.channels.cache.get(process.env.IDS_CHANNELS_EMERGENCY)

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