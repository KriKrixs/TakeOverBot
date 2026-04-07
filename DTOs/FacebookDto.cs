using System.Text.Json.Serialization;

namespace TakeOverBot.DTOs;

public class FacebookTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = string.Empty;

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
}

public class InstagramPostResponse
{
    [JsonPropertyName("data")]
    public InstagramPost[] Data { get; set; } = [];

    [JsonPropertyName("paging")]
    public InstagramPostPaging Paging { get; set; } = new();
}

public class InstagramPost
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("permalink")]
    public string Link { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public string Date { get; set; } = string.Empty;
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