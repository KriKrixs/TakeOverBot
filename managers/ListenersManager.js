import UserJoinLeaveListener from "../listeners/UserJoinLeaveListener.js";
import EmergencyListener from "../listeners/EmergencyListener.js";
import RolesListener from "../listeners/RolesListener.js";

export default class ListenersManager {
    constructor(opt) {
        this.clients    = opt.clients
        this.loggers    = opt.loggers
        this.utils      = opt.utils
        this.listeners  = {
            userJoinLeave: new UserJoinLeaveListener(this),
            emergency: new EmergencyListener(this),
            roles: new RolesListener(this),
        }
    }

    async listen(packet) {
        const action = packet.t;

        // console.log(action)

        if(action === "GUILD_MEMBER_ADD" || action === "GUILD_JOIN_REQUEST_UPDATE") {
            await this.listeners.userJoinLeave.userJoin(packet, action)
        }

        if(action === "GUILD_MEMBER_REMOVE") {
            await this.listeners.userJoinLeave.userLeave(packet)
        }

        if(action === "MESSAGE_CREATE") {
            await this.listeners.emergency.emergency(packet)
        }

        if(action === "MESSAGE_REACTION_ADD") {
            await this.listeners.emergency.emergencyReaction(packet)
        }

        if(action.startsWith("GUILD_ROLE")) {
            await this.listeners.roles.updateWebRoles(packet);
        }
    }
}