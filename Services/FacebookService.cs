using System.Text.Json;
using Discord;
using Discord.WebSocket;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TakeOverBot.DTOs;

namespace TakeOverBot.Services;

public class FacebookService(HttpClient httpClient, IServiceScopeFactory scopeFactory, DiscordSocketClient discordClient)
{
    private const uint ExpirationMinus = 86400;
    private const string BaseUrl = "https://graph.facebook.com/v25.0";

    public async Task FetchLastPost()
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var token = await AutoRefreshToken();

        if (token is null)
        {
            return;
        }

        var instagramId = Environment.GetEnvironmentVariable("INSTAGRAM_USER_ID");

        var response = await httpClient.GetAsync(
            $"{BaseUrl}/{instagramId}/media?fields=permalink,timestamp&access_token={token}"
        );

        try
        {
            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException e)
        {
            SentrySdk.CaptureException(e);
            return;
        }

        var responseBody = await response.Content.ReadAsStringAsync();

        InstagramPostResponse? responseBodyAsJson;

        try
        {
            responseBodyAsJson = JsonSerializer.Deserialize<InstagramPostResponse>(responseBody);

            if (responseBodyAsJson is null)
            {
                throw new Exception("Instagram response body is null");
            }
        }
        catch (Exception e)
        {
            SentrySdk.CaptureException(e);
            return;
        }

        var latestPost = responseBodyAsJson.Data.FirstOrDefault()!;
        var latestPostTimestamp = DateTimeOffset.Parse(latestPost.Date).ToUnixTimeSeconds();

        var lastPost = await dbContext.LastPosts
            .Where(p => p.Platform == "instagram")
            .FirstOrDefaultAsync();

        if (lastPost is null || lastPost.Date == latestPostTimestamp)
        {
            return;
        }

        lastPost.Date = latestPostTimestamp;
        lastPost.VideoId = latestPost.Id;

        await dbContext.SaveChangesAsync();

        var channelId = ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_SOCIAL_NETWORKS") ?? "0");

        var channel = await discordClient.Rest.GetChannelAsync(channelId) as IMessageChannel;

        if (channel is null)
        {
            return;
        }

        await channel.SendMessageAsync(latestPost.Link);
    }

    private async Task<string?> AutoRefreshToken()
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var token = await dbContext.Tokens
            .Where(p => p.Platform == "facebook")
            .FirstOrDefaultAsync();

        if (token == null || DateTimeOffset.UtcNow.ToUnixTimeSeconds() <= token.ExpirationDate)
        {
            return token?.Value;
        }

        var clientId = Environment.GetEnvironmentVariable("FACEBOOK_CLIENT_ID");
        var clientSecret = Environment.GetEnvironmentVariable("FACEBOOK_CLIENT_SECRET");

        var response = await httpClient.GetAsync(
            $"{BaseUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id={clientId}&client_secret={clientSecret}&fb_exchange_token={token.Value}"
        );

        try
        {
            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException e)
        {
            SentrySdk.CaptureException(e);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync();

        FacebookTokenResponse? responseBodyAsJson;

        try
        {
            responseBodyAsJson = JsonSerializer.Deserialize<FacebookTokenResponse>(responseBody);

            if (responseBodyAsJson is null)
            {
                throw new Exception("Facebook response body is null");
            }
        }
        catch (Exception e)
        {
            SentrySdk.CaptureException(e);
            return null;
        }

        token.ExpirationDate = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + responseBodyAsJson.ExpiresIn - ExpirationMinus;
        token.Value = responseBodyAsJson.AccessToken;

        await dbContext.SaveChangesAsync();

        return token.Value;
    }
}