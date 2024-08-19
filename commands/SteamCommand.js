/* Modules */
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import path from 'path'
import {fileURLToPath} from "url";

/* Functions */
import {dateToHumanFormat} from "../functions.js";

/* Package file */
import nodePackage from "../package.json" assert {"type": "json"}

/**
 * Steam command's data
 * This command allow the user to display steam info of a profile
 * @returns SlashCommandOptionsOnlyBuilder
 */
export const data = () => {
    return new SlashCommandBuilder()
        .setName('steam')
        .setDescription('See your steam infos')
        .addStringOption(option =>
            option.setName("link")
                .setDescription("Profile link")
        )
}

/**
 * Steam command execution
 * @param interaction       Discord interaction
 * @param opt               this of CommandsManager object
 * @returns {Promise<void>} Nothing
 */
export const execute = async (interaction, opt) => {
    // Allow more time to handle the interaction
    await interaction.deferReply()

    // Fetch command's options
    const link = interaction.options.getString('link')

    // Declare all the variable, so we don't have multiple names for the same data
    let steamId, personaDisplayState
    let discordUserInDb = []

    // If no link is provided, check the user that execute the command
    if(link === null) {
        // Fetch the user in the database
        discordUserInDb = await opt.clients.mongo.findDocuments("users", { discordId: interaction.user.id, steamId: { $exists: true } })

        // If an error occurred while finding the user in the database
        if(discordUserInDb === false) {
            await opt.loggers.logger.log("WARNING", fileName, "Can't retrieve the user in the database")

            // Reply to the interaction
            return interaction.editReply("Something went wrong")
        }

        // If the user doesn't exist in the database
        if(discordUserInDb.length === 0) {
            // Reply to the interaction
            return interaction.editReply("There is no Steam account linked")
        } else {
            steamId = discordUserInDb[0].steamId
        }
    } else {
        steamId = await opt.clients.steam.getSteamId(link)
    }

    // Fetch the steam user's infos
    const steamUser = await opt.clients.steam.getSteamUser(steamId)

    if(steamUser === null) {
        await opt.loggers.logger.log("WARNING", fileName, "Can't find the steam user with link: " + link)
        return interaction.editReply("Something went wrong")
    }

    // If a user has been found in the database, update it with the new infos
    if(discordUserInDb.length === 1) {
        const result = await opt.clients.mongo.updateDocument("users", { discordId: interaction.user.id }, { $set: { steamName: steamUser.personaname, steamAvatar: steamUser.avatarfull } })

        // If an error occurred while updating the user in the database
        if(result === false) {
            await this.loggers.logger.log("WARNING", fileName, "Can't update the user in the database")

            // Reply to the interaction
            return interaction.editReply("Something went wrong")
        }
    }

    // Format the steam account creation date to human-readable format
    const creationDate = new Date(parseInt(steamUser.timecreated + '000'))
    const dateAsString = dateToHumanFormat(creationDate)

    // Convert the personastate id to human-readable format
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

    // Create the embed
    const embed = new EmbedBuilder()
        .setColor(0x66c0f4)
        .setTitle(steamUser.personaname)
        .setURL(steamUser.profileurl)
        .setThumbnail(steamUser.avatarfull)
        .addFields(
            { name: 'Country'           , value: steamUser.loccountrycode ?? "No info"                          , inline: true },
            { name: 'Real name'         , value: steamUser.realname ?? "No info"                                , inline: true },
            { name: 'Creation date'     , value: dateAsString                                                   , inline: true },
            { name: 'SteamID64'         , value: steamUser.steamid                                              , inline: true },
            { name: 'Status'            , value: personaDisplayState                                            , inline: true},
            { name: 'Profile Visibility', value: steamUser.communityvisibilitystate === 3 ? "Public" : "Private", inline: true },
        )
        .setTimestamp()
        .setFooter({ text: nodePackage.name })

    // Reply to the interaction
    return interaction.editReply({ embeds: [embed] })
}

const fileName = path.basename(fileURLToPath(import.meta.url), '.js')
