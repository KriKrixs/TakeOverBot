import { EmbedBuilder } from "discord.js";
import info from "../package.json" with {"type": "json"}

/**
 * Classe de standardisation des embeds.
 */
export default class Embed {

    /**
     * Fonction principale.
     */
    embed() {
        return new EmbedBuilder()
            .setColor('#000000')
            .setFooter({text: info.displayName + ' ' + info.version});
    }
}