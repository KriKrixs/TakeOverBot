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
                    {name: 'Last Match', value: 'last_match'}
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
            const csStats = await opt.clients.steam.getCsStats(discordUserInDb[0].steamId)

            const embed = new EmbedBuilder()
                .setColor(0xde9b35)
                .setURL("https://steamcommunity.com/profiles/" + discordUserInDb[0].steamId)
                .setThumbnail(discordUserInDb[0].steamAvatar)
                .setTimestamp()
                .setFooter({ text: 'PlotBot' })

            let maps, wins, losses, winPercentage, matchesPlayed, kills, deaths, kdRatio, headshotPercentage, headshotKills, mvps, weaponsKillsStats, mapsRoundsStats

            switch(target) {
                case "user":
                    const timePlayed = Math.round(csStats.filter(stat => stat.name === "total_time_played")[0].value / 3600 * 10) / 10
                    matchesPlayed = csStats.filter(stat => stat.name === "total_matches_played")[0].value
                    const roundsPlayed = csStats.filter(stat => stat.name === "total_rounds_played")[0].value
                    wins = csStats.filter(stat => stat.name === "total_matches_won")[0].value
                    losses = matchesPlayed - wins
                    winPercentage = Math.round(wins * 100 / matchesPlayed * 10) / 10
                    kills = csStats.filter(stat => stat.name === "total_kills")[0].value
                    deaths = csStats.filter(stat => stat.name === "total_deaths")[0].value
                    kdRatio = Math.round(kills / deaths * 100) / 100
                    headshotKills = csStats.filter(stat => stat.name === "total_kills_headshot")[0].value
                    headshotPercentage = Math.round(headshotKills * 100 / kills * 10) / 10
                    mvps = csStats.filter(stat => stat.name === "total_mvps")[0].value
                    const shotsFired = csStats.filter(stat => stat.name === "total_shots_fired")[0].value
                    const shotsHit = csStats.filter(stat => stat.name === "total_shots_hit")[0].value
                    const shotsAccuracy = Math.round(shotsHit * 100 / shotsFired * 10) / 10
                    const bombsPlanted = csStats.filter(stat => stat.name === "total_planted_bombs")[0].value
                    const bombsDefused = csStats.filter(stat => stat.name === "total_defused_bombs")[0].value
                    const hostagesRescued = csStats.filter(stat => stat.name === "total_rescued_hostages")[0].value

                    embed.setTitle(discordUserInDb[0].steamName + " - " + "User stats")
                        .addFields(
                            { name: 'Time Played', value: timePlayed + "h", inline: true },
                            { name: 'Matches Played', value: matchesPlayed.toString(), inline: true },
                            { name: 'Rounds Played', value: roundsPlayed.toString(), inline: true },
                            { name: 'Win %', value: winPercentage + "%", inline: true },
                            { name: 'Wins', value: wins.toString(), inline: true },
                            { name: 'Losses', value: losses.toString(), inline: true },
                            { name: 'K/D', value: kdRatio.toString(), inline: true },
                            { name: 'Kills', value: kills.toString(), inline: true},
                            { name: 'Deaths', value: deaths.toString(), inline: true},
                            { name: 'Headshot %', value: headshotPercentage + "%", inline: true},
                            { name: 'Headshots', value: headshotKills.toString(), inline: true},
                            { name: 'MVP', value: mvps.toString(), inline: true},
                            { name: 'Shots Accuracy', value: shotsAccuracy + "%", inline: true},
                            { name: 'Shots Fired', value: shotsFired.toString(), inline: true},
                            { name: 'Shots Hit', value: shotsHit.toString(), inline: true},
                            { name: 'Bombs Planted', value: bombsPlanted.toString(), inline: true},
                            { name: 'Bombs Defused', value: bombsDefused.toString(), inline: true},
                            { name: 'Hostages Rescued', value: hostagesRescued.toString(), inline: true}
                        )

                    return interaction.editReply({ embeds: [embed] })
                case "rifle":
                case "pistol":
                case "smg":
                case "heavy":
                case "gear":
                case "weapon":
                    weaponsKillsStats = csStats.filter(stat => stat.name.startsWith("total_kills") && !["total_kills", "total_kills_headshot", "total_kills_enemy_weapon", "total_kills_against_zoomed_sniper", "total_kills_enemy_blinded", "total_kills_knife_fight"].includes(stat.name)).sort((a, b) => {
                        if(a.value > b.value)
                            return -1
                    })

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

                    let y = 0

                    for(let i = 0; i < 8; i) {
                        const weapon = weaponsKillsStats[y]

                        if(weapon === undefined)
                            break

                        y++

                        const weaponName = weapon.name.split('_').at(-1)
                        const weaponInfos = weaponsInfos.filter(info => info.name === weaponName)[0]

                        if(target !== "weapon" && weaponInfos.type !== target)
                            continue

                        const weaponShots = csStats.filter(stat => stat.name === "total_shots_" + weaponName)
                        const weaponHits = csStats.filter(stat => stat.name === "total_hits_" + weaponName)

                        let accuracy = weaponHits.length > 0 ? (Math.round(weaponHits[0].value * 100 / weaponShots[0].value * 10) / 10) : null

                        if(weaponName === "taser")
                            accuracy = (Math.round(weapon.value * 100 / weaponShots[0].value * 10) / 10)

                        embed.addFields(
                            { name: weaponInfos.displayName + " - Kills", value: weapon.value.toString(), inline: true },
                            { name: accuracy !== null ? "Accuracy" : '\u200B', value: accuracy !== null ? (accuracy + "%") : '\u200B', inline: true },
                            { name: '\u200B', value: '\u200B', inline: true },
                        )

                        i++
                    }

                    return interaction.editReply({ embeds: [embed] });
                case "map":
                    mapsRoundsStats = csStats.filter(stat => stat.name.startsWith("total_rounds_map")).sort((a, b) => {
                        if(a.value > b.value)
                            return -1
                    })

                    embed.setTitle(discordUserInDb[0].steamName + " - " + "Maps stats")

                    for(let i = 0; i < 8; i++) {
                        const map = mapsRoundsStats[i]

                        const mapName = map.name.split("_").at(-1)
                        const mapInfos = mapsInfos.filter(info => info.name === mapName)[0]
                        const mapWins = csStats.filter(stat => stat.name.startsWith("total_wins_map") && stat.name.endsWith(mapName))[0]
                        const mapWinsPercentage = Math.floor(mapWins.value * 100 / map.value * 10) / 10

                        embed.addFields(
                            { name: mapInfos.displayName + " - Rounds", value: map.value.toString(), inline: true },
                            { name: "Round Win %", value: mapWinsPercentage + "%", inline: true },
                            { name: "Round Win", value: mapWins.value.toString(), inline: true },
                        )
                    }

                    return interaction.editReply({ embeds: [embed] })
                case "last_match":

                default:
                    matchesPlayed = csStats.filter(stat => stat.name === "total_matches_played")[0].value
                    wins = csStats.filter(stat => stat.name === "total_matches_won")[0].value
                    losses = matchesPlayed - wins
                    winPercentage = Math.round(wins * 100 / matchesPlayed * 10) / 10
                    kills = csStats.filter(stat => stat.name === "total_kills")[0].value
                    deaths = csStats.filter(stat => stat.name === "total_deaths")[0].value
                    kdRatio = Math.round(kills / deaths * 100) / 100
                    headshotKills = csStats.filter(stat => stat.name === "total_kills_headshot")[0].value
                    headshotPercentage = Math.round(headshotKills * 100 / kills * 10) / 10
                    mvps = csStats.filter(stat => stat.name === "total_mvps")[0].value

                    embed.setTitle(discordUserInDb[0].steamName + " - " + "Overall stats")
                        .addFields(
                            { name: 'Win %', value: winPercentage + "%", inline: true },
                            { name: 'Wins', value: wins.toString(), inline: true },
                            { name: 'Losses', value: losses.toString(), inline: true },
                            { name: 'K/D', value: kdRatio.toString(), inline: true },
                            { name: 'Kills', value: kills.toString(), inline: true},
                            { name: 'Deaths', value: deaths.toString(), inline: true},
                            { name: 'Headshot %', value: headshotPercentage + "%", inline: true},
                            { name: 'Headshots', value: headshotKills.toString(), inline: true},
                            { name: 'MVP', value: mvps.toString(), inline: true},
                        )

                    weaponsKillsStats = csStats.filter(stat => stat.name.startsWith("total_kills") && !["total_kills", "total_kills_headshot", "total_kills_enemy_weapon", "total_kills_against_zoomed_sniper", "total_kills_enemy_blinded", "total_kills_knife_fight"].includes(stat.name)).sort((a, b) => {
                        if(a.value > b.value)
                            return -1
                    })

                    for(let i = 0; i < 3; i++) {
                        const weapon = weaponsKillsStats[i]

                        const weaponName = weapon.name.split('_').at(-1)
                        const weaponInfos = weaponsInfos.filter(info => info.name === weaponName)[0]

                        embed.addFields(
                            { name: weaponInfos.displayName + " - Kills", value: weapon.value.toString(), inline: true}
                        )
                    }

                    mapsRoundsStats = csStats.filter(stat => stat.name.startsWith("total_rounds_map")).sort((a, b) => {
                        if(a.value > b.value)
                            return -1
                    })

                    for(let i = 0; i < 3; i++) {
                        const map = mapsRoundsStats[i]

                        const mapName = map.name.split("_").at(-1)
                        const mapInfos = mapsInfos.filter(info => info.name === mapName)[0]

                        embed.addFields(
                            { name: mapInfos.displayName + " - Rounds", value: map.value.toString(), inline: true },
                        )
                    }

                    return interaction.editReply({ embeds: [embed] })
            }
        }
    }
}

const weaponsInfos = [
    { name: "knife", displayName: "Knife", type: "gear" },
    { name: "hegrenade", displayName: "Grenade", type: "gear" },
    { name: "glock", displayName: "Glock-18", type: "pistol" },
    { name: "deagle", displayName: "Desert Eagle / R8 Revolver", type: "pistol" },
    { name: "elite", displayName: "Dual Berretas", type: "pistol" },
    { name: "fiveseven", displayName: "Five-SeveN", type: "pistol" },
    { name: "xm1014", displayName: "XM1014", type: "heavy" },
    { name: "mac10", displayName: "MAC-10", type: "smg" },
    { name: "ump45", displayName: "UMP-45", type: "smg" },
    { name: "p90", displayName: "P90", type: "smg" },
    { name: "awp", displayName: "AWP", type: "rifle" },
    { name: "ak47", displayName: "AK-47", type: "rifle" },
    { name: "aug", displayName: "AUG", type: "rifle" },
    { name: "famas", displayName: "Famas", type: "rifle" },
    { name: "g3sg1", displayName: "G3SG1", type: "rifle" },
    { name: "m249", displayName: "M249", type: "heavy" },
    { name: "hkp2000", displayName: "P2000 / USP-S", type: "pistol" },
    { name: "p250", displayName: "P250 / CZ-75", type: "pistol" },
    { name: "sg556", displayName: "SG 553", type: "rifle" },
    { name: "scar20", displayName: "SCAR-20", type: "rifle" },
    { name: "ssg08", displayName: "SSG 08", type: "rifle" },
    { name: "mp7", displayName: "MP7 / MP5-SD", type: "smg" },
    { name: "mp9", displayName: "MP9", type: "smg" },
    { name: "nova", displayName: "Nova", type: "heavy" },
    { name: "negev", displayName: "Negev", type: "heavy" },
    { name: "sawedoff", displayName: "Sawed-Off", type: "heavy" },
    { name: "bizon", displayName: "PP-Bizon", type: "smg" },
    { name: "tec9", displayName: "Tec-9", type: "pistol" },
    { name: "mag7", displayName: "MAG-7", type: "heavy" },
    { name: "m4a1", displayName: "M4A4 / M4A1-S", type: "rifle" },
    { name: "galilar", displayName: "Galil", type: "rifle" },
    { name: "molotov", displayName: "Molotov", type: "gear" },
    { name: "taser", displayName: "Zeus x27", type: "gear" },
]

const mapsInfos = [
    { name: "dust2", displayName: "Dust 2" },
    { name: "italy", displayName: "Italy" },
    { name: "office", displayName: "Office" },
    { name: "cbble", displayName: "Cobblestone" },
    { name: "inferno", displayName: "Inferno" },
    { name: "nuke", displayName: "Nuke" },
    { name: "train", displayName: "Train" },
    { name: "lake", displayName: "Lake" },
    { name: "safehouse", displayName: "Safehouse" },
    { name: "stmarc", displayName: "Saint-Marc" },
    { name: "house", displayName: "House" },
    { name: "bank", displayName: "Bank" },
    { name: "vertigo", displayName: "Vertigo" },
    { name: "monastery", displayName: "Monastery" },
    { name: "shoots", displayName: "Shoots" },
    { name: "baggage", displayName: "Baggage" },
]