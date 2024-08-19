/**
 * SteamClient class
 */
export default class SteamClient {

    /**
     * SteamClient's constructor
     * @param opt this of PlotBot object
     */
    constructor(opt) {
        this.config     = opt.config
        this.loggers    = opt.loggers
    }

    /**
     * Return the SteamID64 from a steam profile link
     * @param link                          Link of the steam profile
     * @returns {Promise<string|boolean>}   The SteamID64 or false if an error occurred
     */
    async getSteamId(link){
        let steamid = ""

        // If Vanity URL => Fetch SteamID64, If normal profile link, just fetch in url
        if (link.includes('steamcommunity.com/id/')) {
            const vanity = link
                .replace('steamcommunity.com/id/', '')
                .replace('https://', '')
                .replace('http://', '')
                .split("/")[0]

            // Resolve the vanity name into the SteamID64
            const url = "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + this.config.steam.apiKey + "&vanityurl=" + vanity

            try {
                const response = await fetch(url)
                const responseJson = await response.json();

                if(responseJson.response.success !== 1) {
                    await this.loggers.logger.log("WARNING", this.constructor.name, "Can't resolve the vanity URL - " + responseJson.response.message)

                    return false
                }

                steamid = responseJson.response.steamid
            } catch (e) {
                await this.loggers.logger.log("WARNING", this.constructor.name, "Can't resolve the vanity URL - " + e.message)

                return false
            }
        } else if (link.includes('steamcommunity.com/profiles/')) {
            steamid = link
                .replace('steamcommunity.com/profiles/', '')
                .replace('https://', '')
                .replace('http://', '')
                .split("/")[0]
        } else {
            return false
        }

        return steamid
    }

    /**
     * Get steam user's infos from SteamID64
     * @param steamid               SteamID64 of the user to fetch
     * @returns {Promise<*|null>}   Steam user's infos or false if an error occurred
     */
    async getSteamUser(steamid) {
        const url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=" + this.config.steam.apiKey + "&steamids=" + steamid

        try {
            const response = await fetch(url);
            const responseJson = await response.json();

            return responseJson.response.players.length > 0 ? responseJson.response.players[0] : null
        } catch (e) {
            await this.loggers.logger.log("WARNING", this.constructor.name, "Can't fetch steam user's infos - " + e.message)

            return false
        }

    }

    /**
     * Get Counter-Strike user's stats from SteamID64
     * @param steamid   SteamID64 of the user to fetch
     * @returns {*}     Counter-Strike user's stats or false if an error occurred
     */
    async getCsStats(steamid) {
        const url = "https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=" + this.config.steam.apiKey + "&steamid=" + steamid

        try {
            const response = await fetch(url)
            const responseJson = await response.json();

            return responseJson.playerstats.stats
        } catch (e) {
            await this.loggers.logger.log("WARNING", this.constructor.name, "Can't fetch Counter-Strike user's stats - " + e.message)

            return false
        }
    }
}
