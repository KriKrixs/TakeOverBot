/* Modules */
import { SlashCommandBuilder } from 'discord.js'
import path from 'path'
import {fileURLToPath} from "url";

/**
 * Unlink command's data
 * This command allow the user to unlink a game platform account from his discord account
 * @returns {Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">}
 */
export const data = () => {
    return new SlashCommandBuilder()
        .setName('unlink')
        .setDescription('Unlink an account')
        .addStringOption(option =>
            option.setName('platform')
                .setDescription("Select a platform")
                .setRequired(true)
                .addChoices(
                    { name: 'Steam', value: 'steam' }
                )
        )
}

/**
 * Unlink command execution
 * @param interaction       Discord interaction
 * @param opt               this of CommandsManager object
 * @returns {Promise<void>} Nothing
 */
export const execute = async (interaction, opt) => {
    // Allow more time to handle the interaction
    await interaction.deferReply();

    // Fetch command's options
    const platform = interaction.options.getString('platform')

    if (platform === "steam") {
        // Fetch the user in the database
        const discordUserInDb = await opt.clients.mongo.findDocuments("users", { discordId: interaction.user.id, steamId: { $exists: true } })

        // If an error occurred while finding the user in the database
        if(discordUserInDb === false) {
            await this.loggers.logger.log("WARNING", fileName, "Can't retrieve the user in the database")

            // Reply to the interaction
            return interaction.editReply("Something went wrong")
        }

        // If the user doesn't exist in the database
        if(discordUserInDb.length === 0) {
            // Reply to the interaction
            return interaction.editReply("There is no Steam account linked")
        }

        // Remove the steam infos into the user's database document
        const result = await opt.clients.mongo.updateDocument("users", { discordId: interaction.user.id }, { $unset: { steamId: '', steamAvatar: '', steamName: '' } })

        // If an error occurred while updating the user in the database
        if(result === false) {
            await this.loggers.logger.log("WARNING", fileName, "Can't update the user in the database")

            // Reply to the interaction
            return interaction.editReply("Something went wrong")
        }

        // Reply to the interaction
        return interaction.editReply("You have successfully unlinked your Steam account")
    }
}

const fileName = path.basename(fileURLToPath(import.meta.url), '.js')