using Discord;
using Discord.WebSocket;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Commands;

public class SendCommand : ISlashCommand
{
    public string Name => "send";
    public string Description => "Envoie un message dans un channel";
    public ISlashCommandOption[] Options => [
        new SlashCommandOption(
            "channel",
            "Channel dans lequel envoyer le message",
            ApplicationCommandOptionType.Channel
        ),
        new SlashCommandOption(
            "message",
            "Contenu du message",
            ApplicationCommandOptionType.String
        )
    ];

    public async Task ExecuteAsync(SocketSlashCommand command)
    {
        await command.DeferAsync(ephemeral: true);

        var allowedRoleId = Environment.GetEnvironmentVariable("DISCORD_IDS_ROLES_PERMBOT");
        var guildUser = command.User as SocketGuildUser;

        var hasPermission = guildUser!.Roles
            .Any(r => r.Id.ToString() == allowedRoleId);

        if (!hasPermission)
        {
            await command.FollowupAsync("Tu n'es pas autorisé à utiliser cette commande.", ephemeral: true);
            return;
        }

        var targetChannel = command.Data.Options.First(o => o.Name == "channel").Value as SocketTextChannel;
        var content = command.Data.Options.First(o => o.Name == "message").Value as string;

        await targetChannel!.SendMessageAsync(content);
        await command.FollowupAsync("Message envoyé !", ephemeral: true);
    }
}