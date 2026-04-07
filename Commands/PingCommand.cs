using Discord.WebSocket;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Commands;

public class PingCommand : ISlashCommand
{
    public string Name => "ping";
    public string Description => "Répond avec Pong !";

    public async Task ExecuteAsync(SocketSlashCommand command)
    {
        await command.RespondAsync("Pong ! 🏓");
    }
}