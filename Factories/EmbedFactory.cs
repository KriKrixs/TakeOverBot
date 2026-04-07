using Discord;

namespace TakeOverBot.Factories;

public static class EmbedFactory
{
    public static EmbedBuilder Create()
    {
        var appVersion = Environment.GetEnvironmentVariable("APP_VERSION");
        var appName = Environment.GetEnvironmentVariable("APP_NAME");

        return new EmbedBuilder()
            .WithColor(Color.Default) // Black
            .WithFooter(footer =>
            {
                footer.Text = $"{appName} • {appVersion}";
            });
    }
}