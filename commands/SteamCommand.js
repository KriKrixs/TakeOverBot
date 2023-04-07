import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import {dateToHumanFormat} from "../functions.js";

export const data = () => {
    return new SlashCommandBuilder()
        .setName('steam')
        .setDescription('See your steam infos')
}

export const execute = async (interaction, opt) => {
    const discordUserInDb = await opt.clients.mongo.findDocuments("users", { discordId: interaction.user.id, steamId: { $exists: true } })

    if(discordUserInDb.length === 0) {
        await interaction.reply("There is no Steam account linked")
    } else {
        const steamUser = await opt.clients.steam.getSteamUser(discordUserInDb[0].steamId)

        await opt.clients.mongo.updateDocument("users", { discordId: interaction.user.id }, { $set: { steamName: steamUser.personaname, steamAvatar: steamUser.avatarfull } })

        const creationDate = new Date(parseInt(steamUser.timecreated + '000'))
        const dateAsString = dateToHumanFormat(creationDate)

        let personaDisplayState

        switch (steamUser.personastate) {
            case 0:
                personaDisplayState = "Offline"
                break;
            case 1:
                personaDisplayState = "Online"
                break;
            case 2:
                personaDisplayState = "Busy"
                break;
            case 3:
                personaDisplayState = "Away"
                break;
            case 4:
                personaDisplayState = "Snooze"
                break;
            case 5:
                personaDisplayState = "Looking for trade"
                break;
            case 6:
                personaDisplayState = "Looking to play"
                break;
            default:
                personaDisplayState = "Offline"
                break;
        }

        const embed = new EmbedBuilder()
            .setColor(0x66c0f4)
            .setTitle(steamUser.personaname)
            .setURL(steamUser.profileurl)
            .setThumbnail(steamUser.avatarfull)
            .addFields(
                { name: 'Country', value: steamUser.loccountrycode ?? "No info", inline: true },
                { name: 'Real name', value: steamUser.realname ?? "No info", inline: true },
                { name: 'Creation date', value: dateAsString, inline: true },
                { name: 'SteamID64', value: steamUser.steamid, inline: true },
                { name: 'Status', value: personaDisplayState, inline: true},
                { name: 'Profile Visibility', value: steamUser.communityvisibilitystate === 3 ? "Public" : "Private", inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'PlotBot' })

        await interaction.reply({ embeds: [embed] })
    }
}