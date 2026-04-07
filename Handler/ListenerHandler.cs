// ListenerHandler.cs
using System.Reflection;
using Discord.WebSocket;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Handler;

public class ListenerHandler
{
    public ListenerHandler(DiscordSocketClient client)
    {
        Assembly.GetExecutingAssembly()
            .GetTypes()
            .Where(t => typeof(IListener).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract)
            .Select(t => (IListener)Activator.CreateInstance(t)!)
            .ToList()
            .ForEach(l => l.Register(client));
    }
}