using Discord;
using Discord.WebSocket;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Commands;

/// <summary>
/// Send command aims to send a message in a given channel.
/// This command is restricted to administrators or specific users.
/// </summary>
public class SendCommand : ISlashCommand
{
    public string Name => "send";
    public string Icon => "📨";
    public string Description => "Envoie un message dans un channel";
    public string[] AllowedRoleIds => ["DISCORD_IDS_ROLES_ADMIN", "DISCORD_IDS_ROLES_PERMBOT"];
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

        var targetChannel = command.Data.Options.First(o => o.Name == "channel").Value as SocketTextChannel;
        var content = command.Data.Options.First(o => o.Name == "message").Value as string;

        await targetChannel!.SendMessageAsync(content);
        await command.FollowupAsync("Message envoyé !", ephemeral: true);
    }
}