/* Modules */
import { appendFileSync, existsSync, mkdirSync } from "fs";

/* Functions */
import {dateToHumanFormat} from "../functions.js";

/**
 * Logger class
 */
export default class Logger {
    /**
     * Log a text in a file and on discord
     * @param state                 State of the log (INFO, WARNING, CRITICAL)
     * @param className             The class name from where the log is called
     * @param text                  The text to log
     * @returns {Promise<boolean>}  Don't care
     */
    async log(state, className, text) {
        console.log(state + " - [" + className + "] " + text)

        const dir = "./logs"

        // If the logs folder don't exist, create it
        if(!existsSync(dir))
            mkdirSync(dir)

        // Define the filename
        const date = new Date()
        const file = dir + "/" + date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0') + ".log"

        // Write in the file
        appendFileSync(file, state + " - [" + className + "] " + text + "\n")

        // Send the log on discord through a webhook
        try {
            await fetch(process.env.DISCORD_LOGWEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: `__**${state}**__ - ${dateToHumanFormat(new Date())} - [${className}] ${text}`
                }),
            });
        } catch (e) {
            appendFileSync(file, "WARNING - [" + this.constructor.name + "] " + e.message + "\n")
        }

        return true
    }
}
