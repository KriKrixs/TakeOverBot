using System.ComponentModel.DataAnnotations;

namespace TakeOverBot.Models;

public class PendingPost
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Platform { get; set; } = string.Empty;

    [Required]
    public string VideoId { get; set; } = string.Empty;

    [Required]
    public string Link { get; set; } = string.Empty;

    [Required]
    public long Expiration { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

    [Required]
    public long Date { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
}