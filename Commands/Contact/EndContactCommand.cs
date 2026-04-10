using Discord.WebSocket;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Commands.Contact;

/// <summary>
/// End contact command aims to close the current contact channel.
/// </summary>
public class EndContactCommand : ISlashCommand
{
    public string Name => "endcontact";
    public string Icon => "🔒";
    public string Description => "Ferme le canal de contact actuel";

    public async Task ExecuteAsync(SocketSlashCommand command)
    {
        await command.DeferAsync(ephemeral: true);

        if (command.Channel is not SocketTextChannel channel)
        {
            await command.FollowupAsync("❌ Cette commande doit être utilisée dans un canal textuel.", ephemeral: true);
            return;
        }

        if (!channel.Name.StartsWith("contactbot"))
        {
            await command.FollowupAsync("❌ Cette commande ne peut être utilisée que dans un canal de contact.", ephemeral: true);
            return;
        }

        await command.FollowupAsync("✅ Fermeture du canal...", ephemeral: true);

        await Task.Delay(TimeSpan.FromSeconds(10));

        await channel.DeleteAsync();
    }
}