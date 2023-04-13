/* Modules */
import { SlashCommandBuilder } from 'discord.js'
import path from 'path'
import {fileURLToPath} from "url";

/**
 * Link command's data
 * This command allow the user to link a game platform account to his discord account
 * @returns {Omit<, "addSubcommand" | "addSubcommandGroup">} SlashCommand
 */
export const data = () => {
    return new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link an account')
        .addStringOption(option =>
            option.setName('platform')
                .setDescription("Select a platform")
                .setRequired(true)
                .addChoices(
                    { name: 'Steam', value: 'steam' }
                )
        )
        .addStringOption(option =>
            option.setName('link')
                .setDescription("Profile link")
                .setRequired(true)
        )
}

/**
 * Link command execution
 * @param interaction       Discord interaction
 * @param opt               this of CommandsManager object
 * @returns {Promise<void>} Nothing
 */
export const execute = async (interaction, opt) => {
    // Allow more time to handle the interaction
    await interaction.deferReply();

    // Fetch command's options
    const platform  = interaction.options.getString('platform')
    const link      = interaction.options.getString('link')

    if (platform === "steam") {
        // Fetch the user in the database
        const steamId           = await opt.clients.steam.getSteamId(link)
        const discordUserInDb   = await opt.clients.mongo.findDocuments("users", { discordId: interaction.user.id })

        // If an error occurred while finding the user in the database
        if(discordUserInDb === false) {
            await this.loggers.logger.log("WARNING", fileName, "Can't retrieve the user in the database")

            // Reply to the interaction
            return interaction.editReply("Something went wrong")
        }

        // If the user doesn't exist in the database, create it
        if(discordUserInDb.length === 0) {
            // Fetch the steam user's infos by the provided SteamID64
            const steamUser = await opt.clients.steam.getSteamUser(steamId)

            // Insert a new document in the database
            const result = await opt.clients.mongo.insertDocuments("users", [{ discordId: interaction.user.id, steamId: steamId, steamName: steamUser.personaname, steamAvatar: steamUser.avatarfull }])

            // If an error occurred while inserting the user in the database
            if(result === false) {
                await this.loggers.logger.log("WARNING", fileName, "Can't insert the new user in the database")

                // Reply to the interaction
                return interaction.editReply("Something went wrong")
            }

            // Reply to the interaction
            return interaction.editReply("You have successfully linked your Steam account")
        } else if(discordUserInDb[0].steamId !== undefined) {
            // If the user already have a steam account linked, just reply to the interaction
            return interaction.editReply("You already have linked your Steam account, use /unlink")
        } else {
            // Fetch the steam user's infos by the provided SteamID64
            const steamUser = await opt.clients.steam.getSteamUser(steamId)

            // Update the document in the database
            const result = await opt.clients.mongo.updateDocument("users", { discordId: interaction.user.id }, { $set: { steamId: steamId, steamName: steamUser.personaname, steamAvatar: steamUser.avatarfull } })

            // If an error occurred while updating the user in the database
            if(result === false) {
                await this.loggers.logger.log("WARNING", fileName, "Can't update the user in the database")

                // Reply to the interaction
                return interaction.editReply("Something went wrong")
            }

            // Reply to the interaction
            return interaction.editReply("You have successfully linked your Steam account")
        }
    }
}

const fileName = path.basename(fileURLToPath(import.meta.url), '.js')