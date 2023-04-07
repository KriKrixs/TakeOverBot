import { SlashCommandBuilder } from 'discord.js'

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

export const execute = async (interaction, opt) => {
    const platform = interaction.options.getString('platform')
    const link = interaction.options.getString('link')

    if (platform === "steam") {
        const steamId = await opt.clients.steam.getSteamId(link)
        const discordUserInDb = await opt.clients.mongo.findDocuments("users", { discordId: interaction.user.id })

        if(discordUserInDb.length === 0) {
            const steamUser = await opt.clients.steam.getSteamUser(steamId)

            await opt.clients.mongo.insertDocuments("users", [{ discordId: interaction.user.id, steamId: steamId, steamName: steamUser.personaname, steamAvatar: steamUser.avatarfull }])

            await interaction.reply("You have successfully linked your Steam account")
        } else if(discordUserInDb[0].steamId !== undefined) {
            await interaction.reply("You already have linked your Steam account, use /unlink")
        } else {
            const steamUser = await opt.clients.steam.getSteamUser(steamId)

            await opt.clients.mongo.updateDocument("users", { discordId: interaction.user.id }, { $set: { steamId: steamId, steamName: steamUser.personaname, steamAvatar: steamUser.avatarfull } })

            await interaction.reply("You have successfully linked your Steam account")
        }
    }
}