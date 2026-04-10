using Discord;
using Discord.WebSocket;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Commands;

/// <summary>
/// Mute commands aims to mute a user for a given duration.
/// </summary>
public class MuteCommand : ISlashCommand
{
    public string Name => "mute";
    public string Icon => "🔇";
    public string Description => "Mute un membre pour une durée donnée";
    public string[] AllowedRoleIds => ["DISCORD_IDS_ROLES_ADMIN"];

    public ISlashCommandOption[] Options =>
    [
        new SlashCommandOption(
            "utilisateur",
            "Membre à mute",
            ApplicationCommandOptionType.User
        ),
        new SlashCommandOption(
            "temps",
            "Durée du mute",
            ApplicationCommandOptionType.Integer
        ),
        new SlashCommandOption(
            "unite",
            "Unité de temps",
            ApplicationCommandOptionType.String,
            IsRequired: true,
            Choices:
            [
                ("Heures", "hours"),
                ("Jours", "days")
            ]
        )
    ];

    public async Task ExecuteAsync(SocketSlashCommand command)
    {
        await command.DeferAsync(ephemeral: true);

        var executor = command.User as SocketGuildUser;
        var options = command.Data.Options.ToDictionary(o => o.Name, o => o.Value);

        var target = options["utilisateur"] as SocketGuildUser;
        var temps = Convert.ToInt64(options["temps"]);
        var unite = options["unite"] as string;

        if (temps <= 0)
        {
            await command.FollowupAsync("❌ La durée doit être supérieure à 0.", ephemeral: true);
            return;
        }

        var duration = unite == "days" ? TimeSpan.FromDays(temps) : TimeSpan.FromHours(temps);

        // Discord limite le timeout à 28 jours
        if (duration.TotalDays > 28)
        {
            await command.FollowupAsync("❌ La durée maximale d'un mute est de **28 jours**.", ephemeral: true);
            return;
        }

        if (target!.Hierarchy >= executor!.Hierarchy)
        {
            await command.FollowupAsync("❌ Tu ne peux pas mute un membre avec un rôle égal ou supérieur au tien.", ephemeral: true);
            return;
        }

        await target.SetTimeOutAsync(duration);

        var dureeFormatee = unite == "days" ? $"{temps} jour{(temps > 1 ? "s" : "")}" : $"{temps} heure{(temps > 1 ? "s" : "")}";

        var channelId = ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_LOGS") ?? "0");
        var channel = executor.Guild.GetTextChannel(channelId);

        await command.FollowupAsync($"✅ {target.Mention} a été mute pour **{dureeFormatee}** par {executor.Mention}.", ephemeral: true);
        await channel!.SendMessageAsync($"✅ {target.Mention} a été mute pour **{dureeFormatee}** par {executor.Mention}.");
    }
}