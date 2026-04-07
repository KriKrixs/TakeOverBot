using Discord;
using Discord.WebSocket;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Listeners.Emergencies;

public class NewEmergencyListener : IListener
{
    internal static DateTime? LastMessageDate;
    internal static readonly Dictionary<ulong, IMessage> PendingBotMessages = new();

    public void Register(DiscordSocketClient client) => client.MessageReceived += OnMessageReceived;

    private static async Task OnMessageReceived(SocketMessage message)
    {
        if (message.Author.IsBot || message.Channel.Id != ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_EMERGENCY") ?? "0"))
            return;

        // Pas d'urgence enregistrée ou salon inactif depuis 30 minutes
        if (LastMessageDate is null ||
            LastMessageDate.Value.AddMinutes(
                int.Parse(Environment.GetEnvironmentVariable("EMERGENCY_INACTIVITY_MINUTES") ?? "30")) <
            DateTime.UtcNow)
        {
            var botMessage = await message.Channel.SendMessageAsync(
                "Ce channel est réservé aux urgences uniquement type panne sur bord de route, accidents ou autre.\n\n"
                + "- Réagissez avec :white_check_mark: si il s'agit d'une urgence immédiate (Panne sur bord de route, accidents, aide urgente)\n"
                + $"- Réagissez avec :x: si ce n'est pas le cas et tournez-vous vers <#{Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_MECANICAL_HELP")}>\n\n"
                + $"Sans aucune réaction, le message sera supprimé automatiquement dans {Environment.GetEnvironmentVariable("EMERGENCY_AUTO_DELETE_MINUTES")} minutes."
            );

            await botMessage.AddReactionsAsync([new Emoji("✅"), new Emoji("❌")]);

            PendingBotMessages[botMessage.Id] = message;

            _ = Task.Run(async () =>
            {
                await Task.Delay(TimeSpan.FromMinutes(int.Parse(Environment.GetEnvironmentVariable("EMERGENCY_AUTO_DELETE_MINUTES") ?? "5")));

                // Si toujours en attente (aucune réaction traitée)
                if (!PendingBotMessages.Remove(botMessage.Id))
                    return;

                await botMessage.DeleteAsync();
                await message.DeleteAsync();
            });
        }
        else
        {
            LastMessageDate = DateTime.UtcNow;
        }
    }
}