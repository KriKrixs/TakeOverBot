// Commands/ClearHelpers.cs
using Discord;
using Discord.WebSocket;

namespace TakeOverBot.Helpers;

public static class ClearCommandHelper
{
    public static async Task<int> DeleteMessagesAsync(SocketTextChannel channel, List<IMessage> messages)
    {
        var cutoff = DateTimeOffset.UtcNow - TimeSpan.FromDays(14);

        var bulk = messages.Where(m => m.Timestamp >= cutoff).ToList();
        var single = messages.Where(m => m.Timestamp < cutoff).ToList();

        if (bulk.Count > 0)
            await channel.DeleteMessagesAsync(bulk);

        foreach (var msg in single)
        {
            await msg.DeleteAsync();
            await Task.Delay(300);
        }

        return messages.Count;
    }
}