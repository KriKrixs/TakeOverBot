import axios from "axios"

export default class SteamClient {
    constructor(opt) {
        this.config = opt.config
    }

    async getSteamId(link){
        let steamid = ""

        // IF Vanity URL => Fetch SteamID64
        if (link.includes('steamcommunity.com/id/')) {
            const vanity = link
                .replace('steamcommunity.com/id/', '')
                .replace('https://', '')
                .replace('http://', '')
                .replace('/', '')

            const url = "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + this.config.steam.apiKey + "&vanityurl=" + vanity;

            const { data: response } = await axios(url)

            if(!response.response.success)
                return false

            steamid = response.response.steamid
        }
        // 64 URL => Clear URL => Steam JSON
        else if (link.includes('steamcommunity.com/profiles/')) {
            steamid = link
                .replace('steamcommunity.com/profiles/', '')
                .replace('https://', '')
                .replace('http://', '')
                .replace('/', '')
        }

        return steamid
    }

    async getSteamUser(steamid) {
        const url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=" + this.config.steam.apiKey + "&steamids=" + steamid

        const { data: response } = await axios(url)

        return response.response.players.length > 0 ? response.response.players[0] : null
    }
}