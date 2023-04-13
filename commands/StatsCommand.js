/* Modules */
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import path from 'path'
import {fileURLToPath} from "url";

/* Package file */
import nodePackage from "../package.json" assert {"type": "json"}

/**
 * Stats command's data
 * This command allow the user to ask for a lot of his statistics on a selected game
 * @returns {Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">} SlashCommand
 */
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
                    {name: 'Overall'        , value: 'overall'},
                    {name: 'User'           , value: 'user'},
                    {name: 'Maps'           , value: 'map'},
                    {name: 'All Weapons'    , value: 'weapon'},
                    {name: 'Rifle Weapons'  , value: 'rifle'},
                    {name: 'Pistol Weapons' , value: 'pistol'},
                    {name: 'SMG Weapons'    , value: 'smg'},
                    {name: 'Heavy Weapons'  , value: 'heavy'},
                    {name: 'Gear Weapons'   , value: 'gear'},
                    {name: 'Last Match'     , value: 'last_match'}
                )
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription("User you want to see the stats (default: you)")
        )
}

export const execute = async (interaction, opt) => {
    // Allow more time to handle the interaction
    await interaction.deferReply();

    // Fetch command's options
    const game      = interaction.options.getString("game")
    const target    = interaction.options.getString("target")

    // If the user is not selected, select the user that executed the command
    const user      = interaction.options.getUser("user") ?? interaction.user

    if(game === "csgo") {
        // Fetch the user in the database
        const discordUserInDb = await opt.clients.mongo.findDocuments("users", { discordId: user.id, steamId: { $exists: true } })

        // If an error occurred while finding the user in the database
        if(discordUserInDb === false) {
            await opt.loggers.logger.log("WARNING", fileName, "Can't retrieve the user in the database")

            // Reply to the interaction
            return interaction.editReply("Something went wrong")
        }

        // If the user with a steam account can't be found in the database
        if(discordUserInDb.length === 0) {
            // Reply to the interaction
            return interaction.editReply("There is no Steam account linked to this user")
        } else {
            // Declare all the variable, so we don't have multiple names for the same data
            let csStats, wins, losses, winPercentage, matchesPlayed, kills, deaths, kdRatio, headshotPercentage, headshotKills, mvps, weaponsKillsStats, mapsRoundsStats

            try {
                // Fetch all the Counter-Strike user's stats
                csStats = await opt.clients.steam.getCsStats(discordUserInDb[0].steamId)
            } catch (e) {
                await this.logger.log("WARNING", fileName, "Can't fetch CS Stats of the user")

                // Reply to the interaction
                return interaction.editReply("Something went wrong")
            }

            // Create the base of the embed that will be sent
            const embed = new EmbedBuilder()
                .setColor(0xde9b35)
                .setURL("https://steamcommunity.com/profiles/" + discordUserInDb[0].steamId)
                .setThumbnail(discordUserInDb[0].steamAvatar)
                .setTimestamp()
                .setFooter({ text: nodePackage.name })

            switch(target) {
                case "user":
                    // Process all the stats
                    const timePlayed        = Math.round(csStats.filter(stat => stat.name === "total_time_played")[0].value / 3600 * 10) / 10
                    matchesPlayed           = csStats.filter(stat => stat.name === "total_matches_played")[0].value
                    const roundsPlayed      = csStats.filter(stat => stat.name === "total_rounds_played")[0].value
                    wins                    = csStats.filter(stat => stat.name === "total_matches_won")[0].value
                    losses                  = matchesPlayed - wins
                    winPercentage           = Math.round(wins * 100 / matchesPlayed * 10) / 10
                    kills                   = csStats.filter(stat => stat.name === "total_kills")[0].value
                    deaths                  = csStats.filter(stat => stat.name === "total_deaths")[0].value
                    kdRatio                 = Math.round(kills / deaths * 100) / 100
                    headshotKills           = csStats.filter(stat => stat.name === "total_kills_headshot")[0].value
                    headshotPercentage      = Math.round(headshotKills * 100 / kills * 10) / 10
                    mvps                    = csStats.filter(stat => stat.name === "total_mvps")[0].value
                    const shotsFired        = csStats.filter(stat => stat.name === "total_shots_fired")[0].value
                    const shotsHit          = csStats.filter(stat => stat.name === "total_shots_hit")[0].value
                    const shotsAccuracy     = Math.round(shotsHit * 100 / shotsFired * 10) / 10
                    const bombsPlanted      = csStats.filter(stat => stat.name === "total_planted_bombs")[0].value
                    const bombsDefused      = csStats.filter(stat => stat.name === "total_defused_bombs")[0].value
                    const hostagesRescued   = csStats.filter(stat => stat.name === "total_rescued_hostages")[0].value

                    // Add infos into the embed
                    embed.setTitle(discordUserInDb[0].steamName + " - " + "User stats")
                        .addFields(
                            { name: 'Time Played'       , value: timePlayed + "h"           , inline: true },
                            { name: 'Matches Played'    , value: matchesPlayed.toString()   , inline: true },
                            { name: 'Rounds Played'     , value: roundsPlayed.toString()    , inline: true },
                            { name: 'Win %'             , value: winPercentage + "%"        , inline: true },
                            { name: 'Wins'              , value: wins.toString()            , inline: true },
                            { name: 'Losses'            , value: losses.toString()          , inline: true },
                            { name: 'K/D'               , value: kdRatio.toString()         , inline: true },
                            { name: 'Kills'             , value: kills.toString()           , inline: true},
                            { name: 'Deaths'            , value: deaths.toString()          , inline: true},
                            { name: 'Headshot %'        , value: headshotPercentage + "%"   , inline: true},
                            { name: 'Headshots'         , value: headshotKills.toString()   , inline: true},
                            { name: 'MVP'               , value: mvps.toString()            , inline: true},
                            { name: 'Shots Accuracy'    , value: shotsAccuracy + "%"        , inline: true},
                            { name: 'Shots Fired'       , value: shotsFired.toString()      , inline: true},
                            { name: 'Shots Hit'         , value: shotsHit.toString()        , inline: true},
                            { name: 'Bombs Planted'     , value: bombsPlanted.toString()    , inline: true},
                            { name: 'Bombs Defused'     , value: bombsDefused.toString()    , inline: true},
                            { name: 'Hostages Rescued'  , value: hostagesRescued.toString() , inline: true}
                        )

                    // Reply to the interaction with the embed
                    return interaction.editReply({ embeds: [embed] })
                case "rifle":
                case "pistol":
                case "smg":
                case "heavy":
                case "gear":
                case "weapon":
                    // Process all the weapons stats and sort it by the number of kills
                    weaponsKillsStats = csStats.filter(stat => stat.name.startsWith("total_kills") && !["total_kills", "total_kills_headshot", "total_kills_enemy_weapon", "total_kills_against_zoomed_sniper", "total_kills_enemy_blinded", "total_kills_knife_fight"].includes(stat.name)).sort((a, b) => {
                        if(a.value > b.value)
                            return -1
                    })

                    // Change the title depending on which weapons stats the user want
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

                    // Add the title to the embed
                    embed.setTitle(discordUserInDb[0].steamName + title)

                    // Loop to fill 8 lines of fields. "y" is for the weapon, "i" is for the fields line
                    let y = 0

                    for(let i = 0; i < 8; i) {
                        const weapon = weaponsKillsStats[y]

                        // If there is no more weapon, stop the loop
                        if(weapon === undefined)
                            break

                        y++

                        // Fetch the weapon name and the weapon infos
                        const weaponName    = weapon.name.split('_').at(-1)
                        const weaponInfos   = weaponsInfos.filter(info => info.name === weaponName)[0]

                        // If the user want a specific weapon type and the current weapon don't respond to this, continue to the next weapon
                        if(target !== "weapon" && weaponInfos.type !== target)
                            continue

                        // Process all the stats
                        const weaponShots   = csStats.filter(stat => stat.name === "total_shots_" + weaponName)
                        const weaponHits    = csStats.filter(stat => stat.name === "total_hits_" + weaponName)
                        let accuracy        = weaponHits.length > 0 ? (Math.round(weaponHits[0].value * 100 / weaponShots[0].value * 10) / 10) : null

                        // If the weapon is the taser, we have to manually calculate the accuracy
                        if(weaponName === "taser")
                            accuracy = (Math.round(weapon.value * 100 / weaponShots[0].value * 10) / 10)

                        // Add the weapon into the embed's fields
                        embed.addFields(
                            { name: weaponInfos.displayName + " - Kills"        , value: weapon.value.toString()                        , inline: true },
                            { name: accuracy !== null ? "Accuracy" : '\u200B'   , value: accuracy !== null ? (accuracy + "%") : '\u200B', inline: true },
                            { name: '\u200B'                                    , value: '\u200B'                                       , inline: true },
                        )

                        i++
                    }

                    // Reply to the interaction with the embed
                    return interaction.editReply({ embeds: [embed] });
                case "map":
                    // Process all the maps stats and sort it by the number of rounds played
                    mapsRoundsStats = csStats.filter(stat => stat.name.startsWith("total_rounds_map")).sort((a, b) => {
                        if(a.value > b.value)
                            return -1
                    })

                    // Add the title to the embed
                    embed.setTitle(discordUserInDb[0].steamName + " - " + "Maps stats")

                    // Loop to fill 8 lines of fields
                    for(let i = 0; i < 8; i++) {
                        const map = mapsRoundsStats[i]

                        // Process all the stats
                        const mapName           = map.name.split("_").at(-1)
                        const mapInfos          = mapsInfos.filter(info => info.name === mapName)[0]
                        const mapWins           = csStats.filter(stat => stat.name.startsWith("total_wins_map") && stat.name.endsWith(mapName))[0]
                        const mapWinsPercentage = Math.floor(mapWins.value * 100 / map.value * 10) / 10

                        // Add the map into the embed's fields
                        embed.addFields(
                            { name: mapInfos.displayName + " - Rounds"  , value: map.value.toString()       , inline: true },
                            { name: "Round Win %"                       , value: mapWinsPercentage + "%"    , inline: true },
                            { name: "Round Win"                         , value: mapWins.value.toString()   , inline: true },
                        )
                    }

                    // Reply to the interaction with the embed
                    return interaction.editReply({ embeds: [embed] })
                case "last_match":
                    // TODO: WIP!
                    return interaction.editReply("WIP!")
                default:
                    // Process all the user's stats
                    matchesPlayed       = csStats.filter(stat => stat.name === "total_matches_played")[0].value
                    wins                = csStats.filter(stat => stat.name === "total_matches_won")[0].value
                    losses              = matchesPlayed - wins
                    winPercentage       = Math.round(wins * 100 / matchesPlayed * 10) / 10
                    kills               = csStats.filter(stat => stat.name === "total_kills")[0].value
                    deaths              = csStats.filter(stat => stat.name === "total_deaths")[0].value
                    kdRatio             = Math.round(kills / deaths * 100) / 100
                    headshotKills       = csStats.filter(stat => stat.name === "total_kills_headshot")[0].value
                    headshotPercentage  = Math.round(headshotKills * 100 / kills * 10) / 10
                    mvps                = csStats.filter(stat => stat.name === "total_mvps")[0].value

                    // Add infos into the embed
                    embed.setTitle(discordUserInDb[0].steamName + " - " + "Overall stats")
                        .addFields(
                            { name: 'Win %'     , value: winPercentage + "%"        , inline: true },
                            { name: 'Wins'      , value: wins.toString()            , inline: true },
                            { name: 'Losses'    , value: losses.toString()          , inline: true },
                            { name: 'K/D'       , value: kdRatio.toString()         , inline: true },
                            { name: 'Kills'     , value: kills.toString()           , inline: true},
                            { name: 'Deaths'    , value: deaths.toString()          , inline: true},
                            { name: 'Headshot %', value: headshotPercentage + "%"   , inline: true},
                            { name: 'Headshots' , value: headshotKills.toString()   , inline: true},
                            { name: 'MVP'       , value: mvps.toString()            , inline: true},
                        )

                    // Process all the weapons stats and sort it by the number of kills
                    weaponsKillsStats = csStats.filter(stat => stat.name.startsWith("total_kills") && !["total_kills", "total_kills_headshot", "total_kills_enemy_weapon", "total_kills_against_zoomed_sniper", "total_kills_enemy_blinded", "total_kills_knife_fight"].includes(stat.name)).sort((a, b) => {
                        if(a.value > b.value)
                            return -1
                    })

                    // Loop to fill 1 line of fields
                    for(let i = 0; i < 3; i++) {
                        const weapon = weaponsKillsStats[i]

                        // Fetch the weapon name and infos
                        const weaponName    = weapon.name.split('_').at(-1)
                        const weaponInfos   = weaponsInfos.filter(info => info.name === weaponName)[0]

                        // Add the info into the embed
                        embed.addFields(
                            { name: weaponInfos.displayName + " - Kills", value: weapon.value.toString(), inline: true}
                        )
                    }

                    // Process all the maps stats and sort it by the number of rounds played
                    mapsRoundsStats = csStats.filter(stat => stat.name.startsWith("total_rounds_map")).sort((a, b) => {
                        if(a.value > b.value)
                            return -1
                    })

                    // Loop to fill 1 line of fields
                    for(let i = 0; i < 3; i++) {
                        const map = mapsRoundsStats[i]

                        // Fetch the map name and infos
                        const mapName   = map.name.split("_").at(-1)
                        const mapInfos  = mapsInfos.filter(info => info.name === mapName)[0]

                        // Add the info into the embed
                        embed.addFields(
                            { name: mapInfos.displayName + " - Rounds", value: map.value.toString(), inline: true },
                        )
                    }

                    // Reply to the interaction with the embed
                    return interaction.editReply({ embeds: [embed] })
            }
        }
    }
}

/**
 * Weapons infos
 * @type {[{displayName: string, name: string, type: string}]}
 */
const weaponsInfos = [
    { name: "hkp2000"   , displayName: "P2000 / USP-S"              , type: "pistol" },
    { name: "p250"      , displayName: "P250 / CZ-75"               , type: "pistol" },
    { name: "glock"     , displayName: "Glock-18"                   , type: "pistol" },
    { name: "deagle"    , displayName: "Desert Eagle / R8 Revolver" , type: "pistol" },
    { name: "elite"     , displayName: "Dual Berretas"              , type: "pistol" },
    { name: "fiveseven" , displayName: "Five-SeveN"                 , type: "pistol" },
    { name: "tec9"      , displayName: "Tec-9"                      , type: "pistol" },
    { name: "mac10"     , displayName: "MAC-10"                     , type: "smg" },
    { name: "ump45"     , displayName: "UMP-45"                     , type: "smg" },
    { name: "p90"       , displayName: "P90"                        , type: "smg" },
    { name: "mp7"       , displayName: "MP7 / MP5-SD"               , type: "smg" },
    { name: "mp9"       , displayName: "MP9"                        , type: "smg" },
    { name: "bizon"     , displayName: "PP-Bizon"                   , type: "smg" },
    { name: "awp"       , displayName: "AWP"                        , type: "rifle" },
    { name: "ak47"      , displayName: "AK-47"                      , type: "rifle" },
    { name: "aug"       , displayName: "AUG"                        , type: "rifle" },
    { name: "famas"     , displayName: "Famas"                      , type: "rifle" },
    { name: "g3sg1"     , displayName: "G3SG1"                      , type: "rifle" },
    { name: "sg556"     , displayName: "SG 553"                     , type: "rifle" },
    { name: "scar20"    , displayName: "SCAR-20"                    , type: "rifle" },
    { name: "ssg08"     , displayName: "SSG 08"                     , type: "rifle" },
    { name: "m4a1"      , displayName: "M4A4 / M4A1-S"              , type: "rifle" },
    { name: "galilar"   , displayName: "Galil"                      , type: "rifle" },
    { name: "m249"      , displayName: "M249"                       , type: "heavy" },
    { name: "nova"      , displayName: "Nova"                       , type: "heavy" },
    { name: "negev"     , displayName: "Negev"                      , type: "heavy" },
    { name: "sawedoff"  , displayName: "Sawed-Off"                  , type: "heavy" },
    { name: "mag7"      , displayName: "MAG-7"                      , type: "heavy" },
    { name: "xm1014"    , displayName: "XM1014"                     , type: "heavy" },
    { name: "molotov"   , displayName: "Molotov"                    , type: "gear" },
    { name: "taser"     , displayName: "Zeus x27"                   , type: "gear" },
    { name: "knife"     , displayName: "Knife"                      , type: "gear" },
    { name: "hegrenade" , displayName: "Grenade"                    , type: "gear" },
]

/**
 * Maps infos
 * @type {[{displayName: string, name: string}]}
 */
const mapsInfos = [
    { name: "dust2"     , displayName: "Dust 2" },
    { name: "italy"     , displayName: "Italy" },
    { name: "office"    , displayName: "Office" },
    { name: "cbble"     , displayName: "Cobblestone" },
    { name: "inferno"   , displayName: "Inferno" },
    { name: "nuke"      , displayName: "Nuke" },
    { name: "train"     , displayName: "Train" },
    { name: "lake"      , displayName: "Lake" },
    { name: "safehouse" , displayName: "Safehouse" },
    { name: "stmarc"    , displayName: "Saint-Marc" },
    { name: "house"     , displayName: "House" },
    { name: "bank"      , displayName: "Bank" },
    { name: "vertigo"   , displayName: "Vertigo" },
    { name: "monastery" , displayName: "Monastery" },
    { name: "shoots"    , displayName: "Shoots" },
    { name: "baggage"   , displayName: "Baggage" },
]

const fileName = path.basename(fileURLToPath(import.meta.url), '.js')