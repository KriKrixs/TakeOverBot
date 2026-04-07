using Discord;
using Discord.WebSocket;
using TakeOverBot.Factories;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Listeners.Members;

public class MemberJoinedListener : IListener
{
    public void Register(DiscordSocketClient client) => client.UserJoined += OnUserJoined;

    private static async Task OnUserJoined(SocketGuildUser user)
    {
        var joinChannel = user.Guild.GetTextChannel(
            ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_JOIN") ?? "0")
        );

        if (joinChannel is null)
            return;

        var embed = EmbedFactory.Create()
            .WithTitle($"📥 Arrivée de {user.Username}")
            .WithDescription($"{user.Username} n'as pas encore accepté les règles.")
            .WithColor(new Color(0x47EFD6))
            .WithThumbnailUrl(user.GetAvatarUrl() ?? "https://cdn.discordapp.com/embed/avatars/2.png")
            .AddField("Bienvenue", user.Mention)
            .Build();

        await joinChannel.SendMessageAsync(embed: embed);
    }
}