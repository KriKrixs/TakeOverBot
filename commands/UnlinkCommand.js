import { SlashCommandBuilder } from 'discord.js'

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

export const execute = async (interaction, opt) => {
    const platform = interaction.options.getString('platform')

    if (platform === "steam") {
        const discordUserInDb = await opt.clients.mongo.findDocuments("users", { discordId: interaction.user.id, steamId: { $exists: true } })

        if(discordUserInDb.length === 0) {
            await interaction.reply("There is no Steam account linked")
        } else {
            await opt.clients.mongo.updateDocument("users", { discordId: interaction.user.id }, { $unset: { steamId: '', steamAvatar: '', steamName: '' } })

            await interaction.reply("You have successfully unlinked your Steam account")
        }
    }
}