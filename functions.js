export const dateToHumanFormat = (date) => {
    return String(date.getDate()).padStart(2, '0') + "/" + String(date.getMonth() + 1).padStart(2, '0') + "/" + date.getFullYear() + " - " + String(date.getHours()).padStart(2, '0') + ":" + String(date.getMinutes()).padStart(2, '0') + ":" + String(date.getSeconds()).padStart(2, '0')
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));