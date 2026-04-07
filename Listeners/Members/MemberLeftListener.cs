using Discord;
using Discord.WebSocket;
using TakeOverBot.Factories;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Listeners.Members;

public class MemberLeftListener : IListener
{
    public void Register(DiscordSocketClient client) => client.UserLeft += OnUserLeft;

    private static async Task OnUserLeft(SocketGuild guild, SocketUser user)
    {
        var joinChannel = guild.GetTextChannel(
            ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_JOIN") ?? "0")
        );

        if (joinChannel is null)
            return;

        var embed = EmbedFactory.Create()
            .WithTitle($"📥 Départ de {user.Username}")
            .WithColor(new Color(0xF04848))
            .WithThumbnailUrl(user.GetAvatarUrl() ?? "https://cdn.discordapp.com/embed/avatars/2.png")
            .AddField("Nom", user.Mention)
            .Build();

        await joinChannel.SendMessageAsync(embed: embed);
    }
}