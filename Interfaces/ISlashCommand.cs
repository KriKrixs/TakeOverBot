using Discord;

namespace TakeOverBot.Interfaces;

public interface ISlashCommand
{
    string Name { get; }
    string Description { get; }
    GuildPermission? RequiredPermission => null;
    ISlashCommandOption[] Options => [];

    Task ExecuteAsync(Discord.WebSocket.SocketSlashCommand command);
}

public interface ISlashCommandOption
{
    string Name { get; }
    string Description { get; }
    ApplicationCommandOptionType Type { get; }
    bool IsRequired => true;
    (string Name, object Value)[] Choices => [];
}

public record SlashCommandOption(
    string Name,
    string Description,
    ApplicationCommandOptionType Type,
    bool IsRequired = true,
    (string Name, object Value)[]? Choices = null
) : ISlashCommandOption
{
    public (string Name, object Value)[] Choices { get; } = Choices ?? [];
}