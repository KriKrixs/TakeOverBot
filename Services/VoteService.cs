using Discord;
using Discord.WebSocket;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TakeOverBot.Models;

namespace TakeOverBot.Services;

public class VoteService(IServiceScopeFactory scopeFactory, DiscordSocketClient discordClient)
{
    public async Task StartAsync()
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync())
        {
            await CheckPollsAsync();
        }
    }

    private async Task CheckPollsAsync()
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        var pollsDue = await dbContext.VotePolls
            .Where(p => !p.ReminderSent && p.RemindAt <= now && p.ExpiresAt > now)
            .ToListAsync();

        foreach (var poll in pollsDue)
        {
            await Reping(poll);
            poll.ReminderSent = true;
        }

        // Nettoyage des sondages expirés
        var expired = await dbContext.VotePolls
            .Where(p => p.ExpiresAt <= now)
            .ToListAsync();

        foreach (var poll in expired)
        {
            await Reping(poll, true);
        }

        dbContext.VotePolls.RemoveRange(expired);

        await dbContext.SaveChangesAsync();
    }

    private async Task Reping(VotePoll poll, bool voteExpired = false)
    {
        try
        {
            var guild = discordClient.GetGuild(poll.GuildId);
            if (guild is null) return;

            var channel = guild.GetTextChannel(poll.ChannelId);
            if (channel is null) return;

            var message = await channel.GetMessageAsync(poll.MessageId) as IUserMessage;
            if (message is null) return;

            // Récupérer tous les membres du rôle cible
            var targetRole = guild.GetRole(poll.TargetRoleId);
            if (targetRole is null) return;

            await guild.DownloadUsersAsync();

            var roleMembers = guild.Users
                .Where(u => !u.IsBot && u.Roles.Any(r => r.Id == poll.TargetRoleId))
                .Select(u => u.Id)
                .ToHashSet();

            // Récupérer tous ceux qui ont voté (sur toutes les réponses)
            var voterIds = new HashSet<ulong>();
            foreach (var answer in message.Poll!.Value.Answers)
            {
                var voters = await message
                    .GetPollAnswerVotersAsync(answer.AnswerId)
                    .FlattenAsync();

                foreach (var voter in voters)
                    voterIds.Add(voter.Id);
            }

            // Membres qui n'ont pas encore voté
            var nonVoters = roleMembers.Except(voterIds).ToList();
            var mentions = string.Empty;

            if (nonVoters.Count > 0)
            {
                mentions = string.Join(" ", nonVoters.Select(id => $"<@{id}>"));
            }

            var nonVotersMessage = nonVoters.Count > 0
                ? $"Les membres suivants n'ont pas voté :\n{mentions}"
                : "Tous les membres ont voté.";

            var botMessage = voteExpired
                ? $"⏰ **Fin du vote !**\n{nonVotersMessage}"
                : nonVoters.Count > 0
                    ? $"⏰ **Rappel de vote !**\nLes membres suivants n'ont pas encore voté :\n{mentions}"
                    : null;

            if (botMessage is not null)
            {
                await channel.SendMessageAsync(botMessage);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[VoteService] Erreur sur le sondage {poll.Id} : {ex.Message}");
        }
    }
}