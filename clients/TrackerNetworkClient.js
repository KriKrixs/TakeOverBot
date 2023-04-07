import axios from 'axios'
import {sleep} from "../functions.js";

export default class TrackerNetworkClient {
    constructor(opt) {
        this.config = opt.config
        this.axiosConfig = {
            headers: {
                "TRN-Api-Key": opt.config.trackerNetwork.apiKey
            }
        }
    }

    async fetchCSGO(steamId, target = "overall") {
        const baseUrl = "https://public-api.tracker.gg/v2/csgo/standard/profile/steam/" + steamId

        let response = { error: true, data: {}}
        let alreadyCalled = false


        if(["overall", "user"].includes(target)) {
            if(alreadyCalled)
                await sleep(1000)

            let userResponse = await axios.get(baseUrl, this.axiosConfig)
                .then(response => {
                    return { error: false, data: response.data}
                })
                .catch(error => {
                    let message

                    if(error.response.status === 429) {
                        message = error.response.data.message
                    } else {
                        message = error.response.data?.errors[0]?.message
                    }

                    return { error: true, message: message }
                })

            response.error = userResponse.error
            response.message = userResponse.message
            response.data.user = userResponse.data ?? {}

            alreadyCalled = true
        }

        if(["overall", "weapon", "heavy", "smg", "pistol", "gear", "rifle"].includes(target)) {
            if(alreadyCalled)
                await sleep(1000)

            let weaponResponse = await axios.get(baseUrl + "/segments/weapon", this.axiosConfig)
                .then(response => {
                    return { error: false, data: response.data}
                })
                .catch(error => {
                    let message

                    if(error.response.status === 429) {
                        message = error.response.data.message
                    } else {
                        message = error.response.data?.errors[0]?.message
                    }

                    return { error: true, message: message }
                })

            response.error = weaponResponse.error
            response.message = weaponResponse.message
            response.data.weapon = weaponResponse.data ?? {}

            alreadyCalled = true
        }

        if(["overall", "map"].includes(target)) {
            if(alreadyCalled)
                await sleep(1000)

            let mapResponse = await axios.get(baseUrl + "/segments/map", this.axiosConfig)
                .then(response => {
                    return { error: false, data: response.data}
                })
                .catch(error => {
                    let message

                    if(error.response.status === 429) {
                        message = error.response.data.message
                    } else {
                        message = error.response.data?.errors[0]?.message
                    }

                    return { error: true, message: message }
                })

            response.error = mapResponse.error
            response.message = mapResponse.message
            response.data.map = mapResponse.data ?? {}
        }

        return response
    }
}