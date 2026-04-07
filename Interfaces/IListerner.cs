using Discord.WebSocket;

namespace TakeOverBot.Interfaces;

public interface IListener
{
    void Register(DiscordSocketClient client);
}