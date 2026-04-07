using Discord;
using Discord.WebSocket;
using TakeOverBot.Factories;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Listeners.Members;

public class MemberScreeningListener : IListener
{
    public void Register(DiscordSocketClient client) => client.GuildMemberUpdated += OnGuildMemberUpdated;

    private static async Task OnGuildMemberUpdated(
        Cacheable<SocketGuildUser, ulong> before,
        SocketGuildUser user)
    {
        var oldUser = await before.GetOrDownloadAsync();

        // IsPending = true signifie que le membre n'a pas encore accepté les règles
        if (oldUser?.IsPending == true && user.IsPending == false)
        {
            var joinChannel = user.Guild.GetTextChannel(
                ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_JOIN") ?? "0")
            );
            var chatChannel = user.Guild.GetTextChannel(
                ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_CHAT") ?? "0")
            );

            if (joinChannel is null || chatChannel is null)
                return;

            var embed = EmbedFactory.Create()
                .WithTitle($"📥 Arrivée de {user.Username}")
                .WithDescription($"{user.Username} a accepté les règles.")
                .WithColor(new Color(0x47EF66))
                .WithThumbnailUrl(user.GetAvatarUrl() ?? "https://cdn.discordapp.com/embed/avatars/2.png")
                .AddField("Bienvenue", user.Mention)
                .Build();

            await joinChannel.SendMessageAsync(embed: embed);

            var presentationChannel = ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_PRESENTATION") ?? "0");

            await chatChannel.SendMessageAsync(
                $"Bienvenue {user.Mention} ! Je te laisse te renommé \"Prénom - Voiture\".\n" +
                $"N'hésite pas à poster des photos de ta caisse et à te présenter dans le salon <#{presentationChannel}> !"
            );

            var roleVisiteur = user.Guild.GetRole(
                ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_ROLES_VISITEUR") ?? "0")
            );

            if (roleVisiteur is not null)
                await user.AddRoleAsync(roleVisiteur);
        }
    }
}