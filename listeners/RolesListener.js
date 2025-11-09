export default class RolesListener {
    constructor(opt) {
        this.clients    = opt.clients
        this.loggers    = opt.loggers
        this.utils      = opt.utils
    }

    async updateWebRoles() {
        const guild = this.clients.discord.getClient().guilds.cache.get(process.env.IDS_GUILD)
        const roles = []

        // Fetch the latest roles data from Discord API instead of using cache
        const fetchedRoles = await guild.roles.fetch();

        fetchedRoles.forEach(role => {
            roles.push({
                id: role.id,
                name: role.name,
                color: `#${role.color.toString(16).padStart(6, '0')}`
            })
        });

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.WEBAPI_ACCEPTSELFSIGNED ? '0' : '1';

        const formData = new FormData();

        formData.append("roles", JSON.stringify(roles));

        try {
            await fetch(`${process.env.WEBAPI_BASEURL}/discord/roles/update`, {
                method: "POST",
                body: formData,
            });
            await this.loggers.logger.log("INFO", this.constructor.name, "Web roles updated successfully");
        } catch (error) {
            await this.loggers.logger.log("CRITICAL", this.constructor.name, `Error updating web roles: ${error.message}`, error);
        }
    }
}
