import UserJoinLeaveListener from "../listeners/UserJoinLeaveListener.js";
import EmergencyListener from "../listeners/EmergencyListener.js";

export default class ListenersManager {
    constructor(opt) {
        this.config     = opt.config
        this.clients    = opt.clients
        this.loggers    = opt.loggers
        this.utils      = opt.utils
        this.listeners  = {
            userJoinLeave: new UserJoinLeaveListener(this),
            emergencyListeners: new EmergencyListener(this)
        }
    }

    async listen(packet) {
        const action = packet.t;

        console.log(action)

        if(action === "GUILD_MEMBER_ADD" || action === "GUILD_JOIN_REQUEST_UPDATE") {
            await this.listeners.userJoinLeave.userJoin(packet, action)
        }

        if(action === "GUILD_MEMBER_REMOVE") {
            await this.listeners.userJoinLeave.userLeave(packet)
        }

        if(action === "MESSAGE_CREATE") {
            await this.listeners.emergencyListeners.emergency(packet)
        }

        if(action === "MESSAGE_REACTION_ADD") {
            await this.listeners.emergencyListeners.emergencyReaction(packet)
        }
    }
}