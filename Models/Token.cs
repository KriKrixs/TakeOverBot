using System.ComponentModel.DataAnnotations;

namespace TakeOverBot.Models;

public class Token
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Platform { get; set; } = string.Empty;

    [Required]
    public string Value { get; set; } = string.Empty;

    [Required]
    public long ExpirationDate { get; set; }
}