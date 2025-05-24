/* Modules */
import { SlashCommandBuilder, MessageFlags } from 'discord.js'

/**
 * Ping command's data
 * This command is just a test to see if the bot is working properly
 * @returns {SlashCommandBuilder} SlashCommand
 */
export const data = () => {
    return new SlashCommandBuilder()
        .setName('send')
        .setDescription('Envoie un message dans un channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel où envoyer le message')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('Message à envoyer')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(0)
}

/**
 * Ping command execution
 * @param interaction       Discord interaction
 * @param opt               App's constructor
 * @returns {Promise<void>} Nothing
 */
export const execute = async (interaction, opt) => {
    // Allow more time to handle the interaction
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const userRoles = interaction.member.roles.cache.filter(roles => roles.id !== interaction.member.guild.id).map(role => role.id);

    if(!userRoles.includes(opt.config.ids.roles.permBot)) {
        await opt.loggers.logger.log("WARNING", "SendCommand", `User <@${interaction.user.id}> tried to use this command without having the rights to do so.`)
        await opt.loggers.logger.log("WARNING", "SendCommand", `Command used: /send ${interaction.options.getChannel('channel')} ${interaction.options.getString('message')}`)
        return interaction.editReply({ content: 'Tu n\'es pas autorisé à utiliser cette commande.' })
    }

    const channel = interaction.options.getChannel('channel');
    channel.send(interaction.options.getString('message'));

    return interaction.editReply({ content: 'Message envoyé !' })
}