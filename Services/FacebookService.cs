using System.Text.Json;
using System.Text.RegularExpressions;
using Discord;
using Discord.WebSocket;
using HtmlAgilityPack;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Playwright;
using TakeOverBot.DTOs;
using TakeOverBot.Models;

namespace TakeOverBot.Services;

public class FacebookService(HttpClient httpClient, IServiceScopeFactory scopeFactory, DiscordSocketClient discordClient)
{
    private const uint ExpirationMinus = 86400;
    private const string BaseUrl = "https://graph.facebook.com/v25.0";
    private long _lastCheckTimestamp;

    public async Task FetchLastPost()
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var token = await AutoRefreshToken();

        if (token is null)
        {
            return;
        }

        var instagramId = Environment.GetEnvironmentVariable("INSTAGRAM_USER_ID")!;

        await FetchMedia(instagramId, token, dbContext);

        var playwrightIp = Environment.GetEnvironmentVariable("PLAYWRIGHT_IP");

        if(playwrightIp is not null)
            await FetchTag(instagramId, token, dbContext, playwrightIp);
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

    private async Task<bool> FetchMedia(string instagramId, string token, AppDbContext dbContext)
    {
        var url = $"{BaseUrl}/{instagramId}/media?fields=permalink,timestamp&access_token={token}";

        var response = await httpClient.GetAsync(url);

        try
        {
            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException e)
        {
            SentrySdk.CaptureException(e);
            return false;
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
            return false;
        }

        var latestPost = responseBodyAsJson.Data.FirstOrDefault()!;
        var latestPostTimestamp = DateTimeOffset.Parse(latestPost.Date).ToUnixTimeSeconds();

        var lastPost = await dbContext.LastPosts
            .Where(p => p.Platform == "instagram")
            .FirstOrDefaultAsync();

        if (lastPost is null || lastPost.Date > latestPostTimestamp)
        {
            return false;
        }

        lastPost.Date = latestPostTimestamp;
        lastPost.VideoId = latestPost.Id;

        await dbContext.SaveChangesAsync();

        var channelId = ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_SOCIAL_NETWORKS") ?? "0");

        if (await discordClient.Rest.GetChannelAsync(channelId) is not IMessageChannel channel)
        {
            return false;
        }

        await channel.SendMessageAsync(latestPost.Link);

        return true;
    }

    private async Task<bool> FetchTag(string instagramId, string token, AppDbContext dbContext, string playwrightIp)
    {
        var url = $"{BaseUrl}/{instagramId}/tags?fields=id,permalink,timestamp&limit=15&access_token={token}";

        var response = await httpClient.GetAsync(url);

        try
        {
            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException e)
        {
            SentrySdk.CaptureException(e);
            return false;
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
            return false;
        }

        var lastPost = await dbContext.LastPosts
            .Where(p => p.Platform == "instagram")
            .FirstOrDefaultAsync();

        if (lastPost is null)
        {
            return false;
        }

        var pendingPosts = await dbContext.PendingPosts
            .Where(p => p.Platform == "instagram")
            .Select(p => new InstagramPost
            {
                Id = p.VideoId,
                Link = p.Link,
                Date = p.Expiration.ToString(),
                IsManual = true
            })
            .ToListAsync();

        var postToHandle = responseBodyAsJson.Data
            .Where(p => DateTimeOffset.Parse(p.Date).ToUnixTimeSeconds() > _lastCheckTimestamp)
            .Where(p => DateTimeOffset.Parse(p.Date).ToUnixTimeSeconds() > lastPost.Date)
            .Where(p => pendingPosts.All(pp => pp.Id != p.Id))
            .Select(p => new InstagramPost
            {
                Id = p.Id,
                Link = p.Link,
                Date = DateTimeOffset.Parse(p.Date).ToUnixTimeSeconds().ToString(),
                IsManual = false
            })
            .Concat(pendingPosts)
            .OrderByDescending(p => p.Date)
            .ToList();

        _lastCheckTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        if(postToHandle.Count == 0)
            return false;

        var channelId = ulong.Parse(Environment.GetEnvironmentVariable("DISCORD_IDS_CHANNELS_SOCIAL_NETWORKS") ?? "0");

        if (await discordClient.Rest.GetChannelAsync(channelId) is not IMessageChannel channel)
            return false;

        var lastPostUpdated = false;

        foreach (var post in postToHandle)
        {
            using var playwright = await Playwright.CreateAsync();
            await using var browser = await playwright.Chromium.ConnectAsync($"ws://{playwrightIp}:8080/");

            var context = await browser.NewContextAsync();

            await context.AddCookiesAsync([
                new Cookie
                {
                    Name = "sessionid",
                    Value = Environment.GetEnvironmentVariable("INSTAGRAM_SESSION_ID") ?? "",
                    Domain = ".instagram.com",
                    Path = "/",
                    HttpOnly = true,
                    Secure = true
                }
            ]);

            var page = await context.NewPageAsync();

            await page.SetExtraHTTPHeadersAsync(new Dictionary<string, string>
            {
                ["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            });

            await page.GotoAsync(post.Link, new PageGotoOptions
            {
                WaitUntil = WaitUntilState.NetworkIdle
            });

            var html = await page.ContentAsync();
            await page.CloseAsync();
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var match = Regex.Match(html, @"""coauthor_producers""\s*:\s*(\[.*?\])", RegexOptions.Singleline);

            if (!match.Success)
                continue;

            var coauthors = JsonSerializer.Deserialize<InstagramScrapCoAuthors[]>(match.Groups[1].Value) ?? [];

            var isCollab = coauthors.Any(c => c.Username == "takeovermotorsport");

            if (!isCollab)
            {
                switch (post.IsManual)
                {
                    case false:
                    {
                        var pendingPost = new PendingPost
                        {
                            Platform = "instagram",
                            Link = post.Link,
                            VideoId = post.Id,
                            Expiration = DateTimeOffset.UtcNow.AddHours(12).ToUnixTimeSeconds(),
                            Date = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                        };

                        await dbContext.PendingPosts.AddAsync(pendingPost);
                        await dbContext.SaveChangesAsync();
                        break;
                    }
                    case true when long.Parse(post.Date) < DateTimeOffset.UtcNow.ToUnixTimeSeconds():
                    {
                        var pendingPost = await dbContext.PendingPosts
                            .Where(p => p.Platform == "instagram" && p.VideoId == post.Id)
                            .FirstOrDefaultAsync();

                        dbContext.PendingPosts.Remove(pendingPost!);
                        await dbContext.SaveChangesAsync();
                        break;
                    }
                }

                continue;
            }

            if (!lastPostUpdated)
            {
                lastPost.Date = long.Parse(post.Date);
                lastPost.VideoId = post.Id;

                lastPostUpdated = true;
            }

            await channel.SendMessageAsync(post.Link);
        }

        return true;
    }
}