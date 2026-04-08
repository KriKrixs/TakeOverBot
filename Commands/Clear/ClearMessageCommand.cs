// Commands/ClearMsgCommand.cs
using Discord;
using Discord.WebSocket;
using TakeOverBot.Factories;
using TakeOverBot.Helpers;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Commands.Clear;

public class ClearMessageCommand : ISlashCommand
{
    public string Name => "clearmsg";
    public string Description => "Supprime tous les messages jusqu'à un message ciblé (non inclus)";

    public ISlashCommandOption[] Options =>
    [
        new SlashCommandOption(
            "message_id",
            "ID du message jusqu'auquel remonter (non inclus)",
            ApplicationCommandOptionType.String
        )
    ];

    public async Task ExecuteAsync(SocketSlashCommand command)
    {
        await command.DeferAsync(ephemeral: true);

        var executor = command.User as SocketGuildUser;
        var allowedRoleId = Environment.GetEnvironmentVariable("DISCORD_IDS_ROLES_ADMIN");

        var hasPermission = executor!.Roles.Any(r => r.Id.ToString() == allowedRoleId);

        if (!hasPermission)
        {
            await command.FollowupAsync("Tu n'es pas autorisé à utiliser cette commande.", ephemeral: true);
            return;
        }

        var messageIdRaw = command.Data.Options.First(o => o.Name == "message_id").Value as string;

        if (!ulong.TryParse(messageIdRaw, out var messageId))
        {
            await command.FollowupAsync("❌ L'ID du message est invalide.", ephemeral: true);
            return;
        }

        if (command.Channel is not SocketTextChannel channel)
        {
            await command.FollowupAsync("❌ Cette commande doit être utilisée dans un canal textuel.", ephemeral: true);
            return;
        }

        var toDelete = new List<IMessage>();

        await foreach (var batch in channel.GetMessagesAsync(limit: 100))
        {
            var reachedTarget = false;

            foreach (var msg in batch)
            {
                if (msg.Id == messageId)
                {
                    reachedTarget = true;
                    break;
                }

                toDelete.Add(msg);
            }

            if (reachedTarget)
                break;
        }

        if (toDelete.Count == 0)
        {
            await command.FollowupAsync("ℹ️ Aucun message à supprimer.", ephemeral: true);
            return;
        }

        var deleted = await ClearCommandHelper.DeleteMessagesAsync(channel, toDelete);

        var logsChannelId = ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_LOGS") ?? "0");
        var logsChannel = executor!.Guild.GetTextChannel(logsChannelId);

        var embed = EmbedFactory.Create()
            .WithTitle($"Clear Messages — {channel.Mention}")
            .WithDescription($"Par {executor.Mention}")
            .WithColor(new Color(0xF04848))
            .AddField("Messages supprimés", deleted)
            .Build();

        await command.FollowupAsync("✅ Clear effectué.", ephemeral: true);

        if (logsChannel is not null)
            await logsChannel.SendMessageAsync(embed: embed);
    }
}