import {parseFromString} from "dom-parser";

export default class InstagramWatcher {
    constructor(opt) {
        this.clients    = opt.clients
        this.loggers    = opt.loggers
        this.utils      = opt.utils
    }

    async getLastPost() {
        console.log("Instagram check")
        const headers = await this.getInstagramHeaders();
        let response;

        try {
            response = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${process.env.WATCHERS_INSTAGRAM_USERNAME}`, {
                method: 'GET',
                headers,
            })
        } catch (e) {
            await this.loggers.logger.log("WARNING", this.constructor.name, "Error while fetching Instagram Post: " + e.message)
            return;
        }

        if(response.ok) {
            const data = await response.json();

            for (let edge of Array.from(data.data.user.edge_owner_to_timeline_media.edges)) {
                const pinnedUsers = edge.node.pinned_for_users;

                let isPinned = false;

                if(Array.from(pinnedUsers).length > 0) {
                    Array.from(pinnedUsers).some(pinnedUser => {
                        if(pinnedUser.username === process.env.WATCHERS_INSTAGRAM_USERNAME) {
                            isPinned = true;
                        }
                    })
                }

                if(!isPinned) {
                    const latestPostKnown = await this.clients.mongo.findDocuments("lastPost", {"shortcode": edge.node.shortcode})

                    if(latestPostKnown.length === 0) {
                        await this.loggers.logger.log("INFO", this.constructor.name, "New Instagram Post!")
                        await this.clients.mongo.removeDocuments("lastPost", {})
                        await this.clients.mongo.insertDocuments("lastPost", [{"shortcode": edge.node.shortcode}])

                        const postUrl = `https://www.instagram.com/${edge.node["is_video"] ? "reel" : "p"}/${edge.node.shortcode}/`

                        const guild = this.clients.discord.getClient().guilds.cache.get(process.env.IDS_GUILD)
                        const instaChannel = guild.channels.cache.get(process.env.IDS_CHANNELS_INSTAGRAM)

                        instaChannel.send(postUrl)
                    }

                    break;
                }
            }
        }
    }

    getInstagramHeaders = async () => {
        const options = {
            method: 'GET',
            credentials: 'same-origin',
        }
        const response = await fetch('https://www.instagram.com/a.thousand.apologies/', options)
        const html = await response.text()
        const document = parseFromString(html)
        const headers = {
            ...Object.fromEntries(response.headers.entries()),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) 20100101 Firefox/103.0',
            'Accept': '*/*',
            'Accept-Language': 'en,en-US;q=0.3',
            'X-Csrftoken': document.rawHTML.split('csrf_token')[1].split('"')[2],
            'X-IG-App-ID': document.rawHTML.split('X-IG-App-ID')[1].split(',')[0].replaceAll('"', '').replace(':', ''),
            'X-ASBD-ID': '198337',
            'X-IG-WWW-Claim': '0',
            'Origin': 'https://www.instagram.com',
            'DNT': '1',
            'Alt-Used': 'i.instagram.com',
            'Connection': 'keep-alive',
            'Referer': 'https://www.instagram.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'Sec-GPC': '1',
        }

        delete headers.Connection
        delete headers['transfer-encoding']

        return headers
    }
}