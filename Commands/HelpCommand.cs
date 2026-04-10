using Discord;
using Discord.WebSocket;
using TakeOverBot.Factories;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Commands;

/// <summary>
/// Help command aims to provide assistance to users by listing available commands or displaying detailed information about a specific command.
/// </summary>
/// <param name="commands">Provided by the CommandHandler</param>
public class HelpCommand(IEnumerable<ISlashCommand> commands) : ISlashCommand
{
    public string Name => "help";
    public string Icon => "📖";
    public string Description => "Affiche la liste des commandes ou le détail d'une commande";

    public ISlashCommandOption[] Options =>
    [
        new SlashCommandOption(
            "commande",
            "Nom de la commande dont afficher le détail",
            ApplicationCommandOptionType.String,
            IsRequired: false
        )
    ];

    /// <summary>
    /// Remove the help command from the list of commands and order by name
    /// </summary>
    private readonly IReadOnlyList<ISlashCommand> _commands = commands
        .Where(c => c is not HelpCommand)
        .OrderBy(c => c.Name)
        .ToList();

    public async Task ExecuteAsync(SocketSlashCommand command)
    {
        if (command.Data.Options.FirstOrDefault(o => o.Name == "commande")?.Value is string commandName)
            await SendCommandDetail(command, commandName);
        else
            await SendCommandList(command);
    }

    /// <summary>
    /// Full list of commands
    /// </summary>
    /// <param name="command">Current command executed</param>
    private async Task SendCommandList(SocketSlashCommand command)
    {
        var lines = _commands.Select(cmd =>
        {
            var roles = GetRoleMentions(cmd);
            var rolesText = roles.Length > 0 ? $"— {string.Join(" ", roles)}" : "";
            return $"{cmd.Icon} **`/{cmd.Name}`** {rolesText} — {cmd.Description}";
        });

        var embed = EmbedFactory.Create()
            .WithTitle("📖 Commandes disponibles")
            .WithDescription(string.Join("\n", lines))
            .WithColor(new Color(0x5865F2))
            .Build();

        await command.RespondAsync(embed: embed, ephemeral: true);
    }

    /// <summary>
    /// Full list of commands
    /// </summary>
    /// <param name="command">Current command executed</param>
    /// <param name="commandName">Command asked</param>
    private async Task SendCommandDetail(SocketSlashCommand command, string commandName)
    {
        var cmd = _commands.FirstOrDefault(c => c.Name == commandName);

        if (cmd is null)
        {
            await command.RespondAsync($"❌ Commande `/{commandName}` introuvable.", ephemeral: true);
            return;
        }

        var embed = EmbedFactory.Create()
            .WithTitle($"{cmd.Icon}  /{cmd.Name}")
            .WithDescription(cmd.Description)
            .WithColor(new Color(0x5865F2));

        var roles = GetRoleMentions(cmd);
        if (roles.Length > 0)
            embed.AddField("🔐 Rôles requis", string.Join(" ", roles), inline: true);

        if (cmd.Options.Length > 0)
        {
            var optionLines = cmd.Options.Select(o =>
            {
                var tag = o.IsRequired ? "requis" : "optionnel";
                return $"- `{o.Name}` *({tag})* — {o.Description}";
            });

            embed.AddField("⚙️ Options", string.Join("\n", optionLines), inline: false);
        }

        await command.RespondAsync(embed: embed.Build(), ephemeral: true);
    }

    /// <summary>
    /// Fetch roles required by a command and return their mentions
    /// </summary>
    /// <param name="cmd">Command to fetch roles for</param>
    /// <returns>Mentions of roles required by the command</returns>
    private static string[] GetRoleMentions(ISlashCommand cmd) =>
        cmd.AllowedRoleIds
            .Select(Environment.GetEnvironmentVariable)
            .Where(id => !string.IsNullOrEmpty(id))
            .Select(id => $"<@&{id}>")
            .ToArray();
}