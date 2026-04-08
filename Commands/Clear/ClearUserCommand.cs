using Discord;
using Discord.WebSocket;
using TakeOverBot.Factories;
using TakeOverBot.Helpers;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Commands.Clear;

public class ClearUserCommand : ISlashCommand
{
    public string Name => "clearuser";
    public string Description => "Supprime les messages d'un utilisateur sur une période donnée";

    public ISlashCommandOption[] Options =>
    [
        new SlashCommandOption(
            "utilisateur",
            "Utilisateur dont supprimer les messages",
            ApplicationCommandOptionType.User
        ),
        new SlashCommandOption(
            "temps",
            "Durée de la période à remonter",
            ApplicationCommandOptionType.Integer
        ),
        new SlashCommandOption(
            "unite",
            "Unité de temps",
            ApplicationCommandOptionType.String,
            IsRequired: true,
            Choices:
            [
                ("Heures", "heures"),
                ("Jours", "jours")
            ]
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

        var options = command.Data.Options.ToDictionary(o => o.Name, o => o.Value);

        var target = options["utilisateur"] as SocketGuildUser;
        var temps = Convert.ToInt64(options["temps"]);
        var unite = options["unite"] as string;

        if (temps <= 0)
        {
            await command.FollowupAsync("❌ La durée doit être supérieure à 0.", ephemeral: true);
            return;
        }

        var since = unite == "jours"
            ? DateTimeOffset.UtcNow - TimeSpan.FromDays(temps)
            : DateTimeOffset.UtcNow - TimeSpan.FromHours(temps);

        var guild = executor.Guild;
        var totalDeleted = 0;
        var channelsAffected = 0;

        foreach (var channel in guild.TextChannels)
        {
            var toDelete = new List<IMessage>();

            await foreach (var batch in channel.GetMessagesAsync(limit: 100))
            {
                var reachedLimit = false;

                foreach (var msg in batch)
                {
                    if (msg.Timestamp < since)
                    {
                        reachedLimit = true;
                        break;
                    }

                    if (msg.Author.Id == target!.Id)
                        toDelete.Add(msg);
                }

                if (reachedLimit)
                    break;
            }

            if (toDelete.Count == 0)
                continue;

            totalDeleted += await ClearCommandHelper.DeleteMessagesAsync(channel, toDelete);
            channelsAffected++;
        }

        var logsChannelId = ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_LOGS") ?? "0");
        var logsChannel = guild.GetTextChannel(logsChannelId);

        var embed = EmbedFactory.Create()
            .WithTitle($"Clear {target!.DisplayName}")
            .WithDescription($"Par {executor.Mention}")
            .WithColor(new Color(0xF04848))
            .WithThumbnailUrl(target.GetAvatarUrl() ?? "https://cdn.discordapp.com/embed/avatars/2.png")
            .AddField("Période", $"{temps} {unite}")
            .AddField("Messages supprimés", totalDeleted)
            .AddField("Channels affectés", channelsAffected)
            .Build();

        await command.FollowupAsync("✅ Clear effectué.", ephemeral: true);

        if (logsChannel is not null)
            await logsChannel.SendMessageAsync(embed: embed);
    }
}