import { appendFileSync, existsSync, mkdirSync } from "fs";
import axios from "axios";

export default class Logger {
    constructor(opt) {
        this.config = opt.config
    }

    async log(state, className, text) {
        const dir = "./logs"

        if(!existsSync(dir))
            mkdirSync(dir)

        const date = new Date()

        const file = dir + "/" + date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0') + ".log"

        appendFileSync(file, state + " - [" + className + "] " + text + "\n")

        try {
            await axios.post(this.config.discord.logWebhook, {content: "__**" + state + "**__ - [" + className + "] " + text})
        } catch (e) {
            appendFileSync(file, "WARNING - [" + this.constructor.name + "] " + e.message + "\n")
        }

        return true
    }
}