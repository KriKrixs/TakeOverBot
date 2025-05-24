import {dateToHumanFormat} from "../functions.js";

export default class UserJoinLeaveListener {
    constructor(opt) {
        this.config     = opt.config
        this.clients    = opt.clients
        this.loggers    = opt.loggers
        this.utils      = opt.utils
    }

    async userJoin(packet, action) {
        const data = packet.d;
        const guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
        const joinChannel = guild.channels.cache.get(this.config.ids.channels.join)
        const chatChannel = guild.channels.cache.get(this.config.ids.channels.chat)
        let user

        if(action === "GUILD_MEMBER_ADD") {
            user = data.user
        } else {
            user = data.request.user
        }

        let description = user.username + " n'a pas encore accepté les règles."
        let color = "#47efd6"

        if(action === "GUILD_JOIN_REQUEST_UPDATE") {
            description = user.username + " a accepté les règles."
            color = "#47EF66"
        }

        let embed = this.utils.Embed.embed().setTitle("📥 Arrivée de " + user.username)
            .setDescription(description)
            .setColor(color)
            .setThumbnail("https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar + ".png")
            .addFields({ name: "Bienvenue", value: "<@!" + user.id + ">" })
            .addFields({ name: "Date", value: dateToHumanFormat(new Date()) })

        joinChannel.send({ embeds: [embed] })

        if(action === "GUILD_JOIN_REQUEST_UPDATE") {
            chatChannel.send("" +
                "Bienvenue <@!" + user.id + "> ! Je te laisse te renommé \"Prénom - Voiture\".\n" +
                "N'hésite pas à poster des photos de ta caisse dans <#" + this.config.ids.channels.photos + ">.\n" +
                "Tu peux également te présenter et partager ton instagram dans <#" + this.config.ids.channels.presentation + "> !"
            )

            const roleVisiteur = guild.roles.cache.find(role => role.id === this.config.ids.roles.visiteur);
            const member = guild.members.cache.get(user.id)

            member.roles.add(roleVisiteur)
        }
    }

    async userLeave(packet) {
        const data = packet.d;
        const guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
        const channel = guild.channels.cache.get(this.config.ids.channels.join)

        let embed = this.utils.Embed.embed().setTitle("📤 Départ de " + data.user.username)
            .setColor('#F04848')
            .setThumbnail("https://cdn.discordapp.com/avatars/" + data.user.id + "/" + data.user.avatar + ".png")
            .addFields({ name: "Nom", value: "<@!" + data.user.id + ">" })
            .addFields({ name: "Date", value: dateToHumanFormat(new Date()) })

        channel.send({ embeds: [embed] })
    }
}