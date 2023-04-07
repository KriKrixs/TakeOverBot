import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import {dateToHumanFormat} from "../functions.js";

export const data = () => {
    return new SlashCommandBuilder()
        .setName('stats')
        .setDescription('See your game stats')
        .addStringOption(option =>
            option.setName('game')
                .setDescription("Select a game")
                .setRequired(true)
                .addChoices(
                    {name: 'CS:GO', value: 'csgo'}
                )
        )
        .addStringOption(option =>
            option.setName('target')
                .setDescription("What stats do you want")
                .setRequired(true)
                .addChoices(
                    {name: 'Overall', value: 'overall'},
                    {name: 'User', value: 'user'},
                    {name: 'Maps', value: 'map'},
                    {name: 'All Weapons', value: 'weapon'},
                    {name: 'Rifle Weapons', value: 'rifle'},
                    {name: 'Pistol Weapons', value: 'pistol'},
                    {name: 'SMG Weapons', value: 'smg'},
                    {name: 'Heavy Weapons', value: 'heavy'},
                    {name: 'Gear Weapons', value: 'gear'},
                )
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription("User you want to see the stats (default: you)")
        )
}

export const execute = async (interaction, opt) => {
    await interaction.deferReply();

    const game = interaction.options.getString("game")
    const user = interaction.options.getUser("user") ?? interaction.user
    const target = interaction.options.getString("target")

    if(game === "csgo") {
        const discordUserInDb = await opt.clients.mongo.findDocuments("users", { discordId: user.id, steamId: { $exists: true } })

        if(discordUserInDb.length === 0) {
            await interaction.editReply("There is no Steam account linked to this user")
        } else {
            let response = await opt.clients.trackerNetwork.fetchCSGO(discordUserInDb[0].steamId, target)

            if (response.error)
                return interaction.editReply("An error occured: " + response.message)
            else
                response = response.data

            const embed = new EmbedBuilder()
                .setColor(0xde9b35)
                .setURL("https://tracker.gg/csgo/profile/steam/" + discordUserInDb[0].steamId)
                .setThumbnail(discordUserInDb[0].steamAvatar)
                .setTimestamp()
                .setFooter({ text: 'PlotBot' })

            let weapons, maps = []

            switch(target) {
                case "user":
                    const stats = response.user.data.segments[0].stats

                    embed.setTitle(discordUserInDb[0].steamName + " - " + "User stats")
                        .setDescription("Top: Lower is better")
                        .addFields(
                            { name: 'Time Played', value: stats.timePlayed.displayValue + "\nTop " + (100 - stats.timePlayed.percentile) + "%", inline: true },
                            { name: 'Matches Played', value: stats.matchesPlayed.displayValue + "\nTop " + (100 - stats.matchesPlayed.percentile) + "%", inline: true },
                            { name: 'Rounds Played', value: stats.roundsPlayed.displayValue + "\nTop " + (100 - stats.roundsPlayed.percentile) + "%", inline: true },
                            { name: 'Win %', value: stats.wlPercentage.displayValue + "\nTop " + (100 - stats.wlPercentage.percentile) + "%", inline: true },
                            { name: 'Wins', value: stats.wins.displayValue + "\nTop " + (100 - stats.wins.percentile) + "%", inline: true },
                            { name: 'Losses', value: stats.losses.displayValue + "\nTop " + (100 - stats.losses.percentile) + "%", inline: true },
                            { name: 'K/D', value: stats.kd.displayValue + "\nTop " + (100 - stats.kd.percentile) + "%", inline: true },
                            { name: 'Kills', value: stats.kills.displayValue + "\nTop " + (100 - stats.kills.percentile) + "%", inline: true},
                            { name: 'Deaths', value: stats.deaths.displayValue + "\nTop " + (100 - stats.deaths.percentile) + "%", inline: true},
                            { name: 'Headshot %', value: stats.headshotPct.displayValue + "\nTop " + (100 - stats.headshotPct.percentile) + "%", inline: true},
                            { name: 'Headshots', value: stats.headshots.displayValue + "\nTop " + (100 - stats.headshots.percentile) + "%", inline: true},
                            { name: 'MVP', value: stats.mvp.displayValue + "\nTop " + (100 - stats.mvp.percentile) + "%", inline: true},
                            { name: 'Shots Accuracy', value: stats.shotsAccuracy.displayValue + "\nTop " + (100 - stats.shotsAccuracy.percentile) + "%", inline: true},
                            { name: 'Shots Fired', value: stats.shotsFired.displayValue + "\nTop " + (100 - stats.shotsFired.percentile) + "%", inline: true},
                            { name: 'Shots Hit', value: stats.shotsHit.displayValue + "\nTop " + (100 - stats.shotsHit.percentile) + "%", inline: true},
                            { name: 'Bombs Planted', value: stats.bombsPlanted.displayValue + "\nTop " + (100 - stats.bombsPlanted.percentile) + "%", inline: true},
                            { name: 'Bombs Defused', value: stats.bombsDefused.displayValue + "\nTop " + (100 - stats.bombsDefused.percentile) + "%", inline: true},
                            { name: 'Hostages Rescued', value: stats.hostagesRescued.displayValue + "\nTop " + (100 - stats.hostagesRescued.percentile) + "%", inline: true}
                        )

                    return interaction.editReply({ embeds: [embed] })
                case "rifle":
                case "pistol":
                case "smg":
                case "heavy":
                case "gear":
                case "weapon":
                    weapons = response.weapon.data.sort((a, b) => {
                        if(a.stats.kills.value > b.stats.kills.value)
                            return -1
                    })

                    if(target !== "weapon")
                        weapons = weapons.filter(weapon => weapon.attributes.categoryKey === target)

                    let title

                    switch (target) {
                        case "rifle":
                            title = " - Rifle weapons stats"
                            break;
                        case "pistol":
                            title = " - Pistol weapons stats"
                            break;
                        case "smg":
                            title = " - SMG weapons stats"
                            break;
                        case "heavy":
                            title = " - Heavy weapons stats"
                            break;
                        case "gear":
                            title = " - Gear weapons stats"
                            break;
                        default:
                            title = " - All weapons stats"
                            break;
                    }

                    embed.setTitle(discordUserInDb[0].steamName + title)
                        .setDescription((weapons.length > 6 ? "More weapons on the tracker network website (click just above)\n" : "") + "Top: Lower is better")

                    for(let i = 0; i < 6; i++) {
                        let weapon = weapons[i]

                        if(weapon !== undefined) {
                            let accuracy = weapon.stats.shotsAccuracy.displayValue + "\nTop: " + (100 - weapon.stats.shotsAccuracy.percentile) + "%"
                            let hit = weapon.stats.shotsHit.displayValue + "\nTop: " + (100 - weapon.stats.shotsHit.percentile) + "%"

                            if(target === "gear") {
                                accuracy = Math.floor(weapon.stats.kills.value * 100 / weapon.stats.shotsFired.value) + "%"
                                hit = weapon.stats.shotsFired.displayValue
                            }

                            embed.addFields(
                                { name: weapon.metadata.name + " - Kills", value: weapon.stats.kills.displayValue + "\nTop: " + (100 - weapon.stats.kills.percentile) + "%", inline: true },
                                { name: "Accuracy", value: accuracy, inline: true },
                                { name: "Hit", value: hit, inline: true },
                            )
                        }
                    }

                    return interaction.editReply({ embeds: [embed] });
                case "map":
                    maps = response.map.data.sort((a, b) => {
                        if(a.stats.rounds.value > b.stats.rounds.value)
                            return -1
                    })

                    embed.setTitle(discordUserInDb[0].steamName + " - " + "Maps stats")
                        .setDescription("More maps on the tracker network website (click just above)")

                    for(let i = 0; i < 6; i++) {
                        let map = maps[i]

                        embed.addFields(
                            { name: map.metadata.name + " - Rounds", value: map.stats.rounds.displayValue, inline: true },
                            { name: "Round Win %", value: Math.floor(map.stats.wins.value * 100 / map.stats.rounds.value) + "%", inline: true },
                            { name: "Round Win", value: map.stats.wins.displayValue, inline: true },
                        )
                    }

                    return interaction.editReply({ embeds: [embed] })
                default:
                    const user = response.user.data.segments[0].stats
                    const weapon = response.weapon.data
                    const map = response.map.data

                    embed.setTitle(discordUserInDb[0].steamName + " - " + "Overall stats")
                        .setDescription("Top: Lower is better")
                        .addFields(
                            { name: 'Win %', value: user.wlPercentage.displayValue + "\nTop " + (100 - user.wlPercentage.percentile) + "%", inline: true },
                            { name: 'Wins', value: user.wins.displayValue + "\nTop " + (100 - user.wins.percentile) + "%", inline: true },
                            { name: 'Losses', value: user.losses.displayValue + "\nTop " + (100 - user.losses.percentile) + "%", inline: true },
                            { name: 'K/D', value: user.kd.displayValue + "\nTop " + (100 - user.kd.percentile) + "%", inline: true },
                            { name: 'Kills', value: user.kills.displayValue + "\nTop " + (100 - user.kills.percentile) + "%", inline: true},
                            { name: 'Deaths', value: user.deaths.displayValue + "\nTop " + (100 - user.deaths.percentile) + "%", inline: true},
                            { name: 'Headshot %', value: user.headshotPct.displayValue + "\nTop " + (100 - user.headshotPct.percentile) + "%", inline: true},
                            { name: 'Headshots', value: user.headshots.displayValue + "\nTop " + (100 - user.headshots.percentile) + "%", inline: true},
                            { name: 'MVP', value: user.mvp.displayValue + "\nTop " + (100 - user.mvp.percentile) + "%", inline: true},
                        )

                    weapons = weapon.sort((a, b) => {
                        if(a.stats.kills.value > b.stats.kills.value)
                            return -1
                    })

                    for(let i = 0; i < 3; i++) {
                        let weapon = weapons[i]

                        embed.addFields(
                            { name: weapon.metadata.name + " - Kills", value: weapon.stats.kills.displayValue + "\nTop: " + (100 - weapon.stats.kills.percentile) + "%", inline: true}
                        )
                    }

                    maps = map.sort((a, b) => {
                        if(a.stats.rounds.value > b.stats.rounds.value)
                            return -1
                    })

                    for(let i = 0; i < 3; i++) {
                        let map = maps[i]

                        embed.addFields(
                            { name: map.metadata.name + " - Rounds", value: map.stats.rounds.displayValue, inline: true },
                        )
                    }

                    return interaction.editReply({ embeds: [embed] })
            }
        }
    }
}