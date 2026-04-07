using Discord;
using Discord.WebSocket;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Listeners.Emergencies;

public class EmergencyReactionListener : IListener
{
    public void Register(DiscordSocketClient client) => client.ReactionAdded += OnReactionAdded;

    private static async Task OnReactionAdded(
        Cacheable<IUserMessage, ulong> cachedMessage,
        Cacheable<IMessageChannel, ulong> cachedChannel,
        SocketReaction reaction)
    {
        if (reaction.UserId == ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_BOT") ?? "0"))
            return;

        if (!NewEmergencyListener.PendingBotMessages.TryGetValue(reaction.MessageId, out var triggerMessage))
            return;

        var emoteName = reaction.Emote.Name;
        if (emoteName != "✅" && emoteName != "❌")
            return;

        // On retire le message du dictionnaire pour désactiver le timeout
        NewEmergencyListener.PendingBotMessages.Remove(reaction.MessageId);

        var botMessage = await cachedMessage.GetOrDownloadAsync();

        if (emoteName == "✅")
        {
            await botMessage.DeleteAsync();
            NewEmergencyListener.LastMessageDate = DateTime.UtcNow;

            await triggerMessage.Channel.SendMessageAsync("@everyone");
        }
        else // ❌
        {
            await botMessage.DeleteAsync();
            await triggerMessage.DeleteAsync();
        }
    }
}