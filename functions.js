/**
 * Convert a date object to human format
 * @param date          Date object
 * @returns {string}    Date in human format
 */
export const dateToHumanFormat = date => String(date.getDate()).padStart(2, '0') + "/" + String(date.getMonth() + 1).padStart(2, '0') + "/" + date.getFullYear() + " - " + String(date.getHours()).padStart(2, '0') + ":" + String(date.getMinutes()).padStart(2, '0') + ":" + String(date.getSeconds()).padStart(2, '0')

/**
 * Sleep function
 * @param ms                    Waiting time in ms
 * @returns {Promise<unknown>}  Timeout to do nothing
 */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));