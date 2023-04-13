/* Modules */
import { SlashCommandBuilder } from 'discord.js'

/**
 * Ping command's data
 * This command is just a test to see if the bot is working properly
 * @returns {SlashCommandBuilder} SlashCommand
 */
export const data = () => {
    return new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!')
}

/**
 * Ping command execution
 * @param interaction       Discord interaction
 * @returns {Promise<void>} Nothing
 */
export const execute = async (interaction) => {
    // Reply to the interaction
    return interaction.reply('Pong!');
}