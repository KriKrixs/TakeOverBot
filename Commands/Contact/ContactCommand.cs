using Discord;
using Discord.WebSocket;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Commands.Contact;

public class ContactCommand : ISlashCommand
{
    public string Name => "contact";
    public string Icon => "📩";
    public string Description => "Ouvre un canal de contact avec le staff ou uniquement les admins";
    public ISlashCommandOption[] Options =>
    [
        new SlashCommandOption(
            Name: "cible",
            Description: "Qui contacter ?",
            Type: ApplicationCommandOptionType.String,
            IsRequired: true,
            Choices:
            [
                ("Staff", "staff"),
                ("Admin", "admin")
            ]
        )
    ];

    public async Task ExecuteAsync(SocketSlashCommand command)
    {
        await command.DeferAsync(ephemeral: true);

        var cible = command.Data.Options.First(o => o.Name == "cible").Value as string;
        var user = command.User as SocketGuildUser;
        var guild = user!.Guild;

        var categoryId = ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CATEGORIES_CONTACT") ?? "0");
        var roleId = ulong.Parse(Environment.GetEnvironmentVariable(
            cible == "admin" ? "DISCORD_IDS_ROLES_ADMIN" : "DISCORD_IDS_ROLES_STAFF"
        ) ?? "0");
        var muteRoleId = ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_ROLES_MUTE") ?? "0");

        var targetRole = guild.GetRole(roleId);
        var muteRole = guild.GetRole(muteRoleId);

        if (targetRole is null)
        {
            await command.FollowupAsync("❌ Impossible de créer le canal. Rôle introuvable.", ephemeral: true);
            return;
        }

        var channelName = $"contactbot-{cible}-{user.DisplayName.ToLower().Replace(" ", "_")}";

        var permissions = new List<Overwrite>
        {
            // Refuser l'accès à @everyone
            new(guild.EveryoneRole.Id, PermissionTarget.Role, new OverwritePermissions(viewChannel: PermValue.Deny)),
            // Autoriser le rôle cible (staff ou admin)
            new(targetRole.Id, PermissionTarget.Role, new OverwritePermissions(viewChannel: PermValue.Allow, sendMessages: PermValue.Allow)),
            // Autoriser l'utilisateur
            new(user.Id, PermissionTarget.User, new OverwritePermissions(viewChannel: PermValue.Allow, sendMessages: PermValue.Allow)),
            // Mute
            new(muteRole.Id, PermissionTarget.Role, new OverwritePermissions(sendMessages: PermValue.Deny))
        };

        var channel = await guild.CreateTextChannelAsync(channelName, props =>
        {
            props.CategoryId = categoryId;
            props.PermissionOverwrites = permissions;
        });

        await channel.SendMessageAsync($"{targetRole.Mention} | {user.Mention}\n\nHello {user.Mention}, un membre {(cible == "admin" ? "des admins" : "du staff")} va te répondre dès que possible.");

        await command.FollowupAsync($"✅ Canal créé : {channel.Mention}", ephemeral: true);
    }
}