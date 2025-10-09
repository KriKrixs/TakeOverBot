export default class YouTubeWatcher {
    constructor(opt) {
        this.clients    = opt.clients
        this.loggers    = opt.loggers
        this.utils      = opt.utils
    }

    async getLastVideo(playlistId) {
        console.log("YouTube check")
        const response = await fetch(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${process.env.WATCHERS_YOUTUBE_APIKEY}`)

        if(response.ok) {
            const data = await response.json()

            if(Array.from(data.items).length > 0) {
                const videoId = data.items[0].snippet.resourceId.videoId;

                const latestVideoKnown = await this.clients.mongo.findDocuments("lastVideo", {playlistId, videoId})

                if(latestVideoKnown.length === 0) {
                    await this.loggers.logger.log("INFO", this.constructor.name, "New YouTube Video!")
                    await this.clients.mongo.removeDocuments("lastVideo", {playlistId})
                    await this.clients.mongo.insertDocuments("lastVideo", [{playlistId, videoId}])

                    const shortResponse = await fetch(`https://www.youtube.com/shorts/${videoId}`)

                    const videoUrl = shortResponse.ok ? shortResponse.url : `https://www.youtube.com/watch?v=${videoId}`

                    const guild = this.clients.discord.getClient().guilds.cache.get(process.env.IDS_GUILD)
                    const youtubeChannel = guild.channels.cache.get(process.env.IDS_CHANNELS_YOUTUBE)

                    youtubeChannel.send(videoUrl)
                }
            }
        }
    }
}