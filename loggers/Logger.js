/* Functions */
import {dateToHumanFormat} from "../functions.js";

/**
 * Logger class
 */
export default class Logger {
    /**
     * Logger's constructor
     * @param sentry this
     */
    constructor(sentry) {
        this.sentry = sentry
    }

    /**
     * Log a text in a file and on discord
     * @param state                 State of the log (INFO, WARNING, CRITICAL)
     * @param className             The class name from where the log is called
     * @param text                  The text to log
     * @param exception             Exception if state is not "INFO"
     * @param exit                  If we want to kill the program
     * @returns {Promise<boolean>}  Don't care
     */
    async log(state, className, text, exception = null, exit = false) {
        let logMessage = state + " - [" + className + "] " + text;

        console.log(logMessage);

        if(state !== "INFO" && exception !== null) {
            this.sentry.captureException(exception)
        }

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
            this.sentry.captureException(e)
        }

        if(exit) {
            await this.sentry.flush(5000);

            process.exit(1);
        }

        return true
    }
}
