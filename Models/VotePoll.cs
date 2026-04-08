using System.ComponentModel.DataAnnotations;

namespace TakeOverBot.Models;

public class VotePoll
{
    [Key]
    public int Id { get; set; }

    [Required]
    public ulong GuildId { get; set; }

    [Required]
    public ulong ChannelId { get; set; }

    [Required]
    public ulong MessageId { get; set; }

    [Required]
    public ulong TargetRoleId { get; set; }

    [Required]
    public long ExpiresAt { get; set; }

    [Required]
    public long RemindAt { get; set; }

    public bool ReminderSent { get; set; } = false;
}