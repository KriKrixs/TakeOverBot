using Discord.WebSocket;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Commands;

/// <summary>
/// Ping command is just here to check if the bot is online.
/// </summary>
public class PingCommand : ISlashCommand
{
    public string Name => "ping";
    public string Icon => "🏓";
    public string Description => "Répond avec Pong !";

    public async Task ExecuteAsync(SocketSlashCommand command)
    {
        await command.RespondAsync("Pong ! 🏓");
    }
}