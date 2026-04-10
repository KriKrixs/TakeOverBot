using System.Text.Json.Serialization;

namespace TakeOverBot.DTOs;

public class FacebookTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; init; } = string.Empty;

    [JsonPropertyName("token_type")]
    public string TokenType { get; init; } = string.Empty;

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; init; }
}

public class InstagramPostResponse
{
    [JsonPropertyName("data")]
    public InstagramPost[] Data { get; init; } = [];

    [JsonPropertyName("paging")]
    public InstagramPostPaging Paging { get; init; } = new();
}

public class InstagramPost
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;

    [JsonPropertyName("permalink")]
    public string Link { get; init; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public string Date { get; init; } = string.Empty;

    public bool IsManual { get; init; } = false;
}

public class InstagramPostPaging
{
    [JsonPropertyName("cursors")]
    public InstagramPostPagingCursors Cursors { get; set; } = new();

    [JsonPropertyName("next")]
    public string? Next { get; set; } = string.Empty;
}

public class InstagramPostPagingCursors
{
    [JsonPropertyName("before")]
    public string Before { get; set; } = string.Empty;

    [JsonPropertyName("after")]
    public string After { get; set; } = string.Empty;
}

public class InstagramScrapCoAuthors
{
    [JsonPropertyName("pk")]
    public string Pk { get; init; } = string.Empty;

    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;

    [JsonPropertyName("username")]
    public string Username { get; init; } = string.Empty;

    [JsonPropertyName("full_name")]
    public string FullName { get; init; } = string.Empty;

    [JsonPropertyName("is_verified")]
    public bool IsVerified { get; init; }

    [JsonPropertyName("is_unpublished")]
    public bool? IsUnpublished { get; init; }

    [JsonPropertyName("profile_pic_url")]
    public string ProfilePicUrl { get; init; } = string.Empty;

    [JsonPropertyName("__typename")]
    public string Typename { get; init; } = string.Empty;

    [JsonPropertyName("friendship_status")]
    public object? FriendshipStatus { get; init; }

    [JsonPropertyName("supervision_info")]
    public object? SupervisionInfo { get; init; }
}