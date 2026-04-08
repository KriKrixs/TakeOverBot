// CommandHandler.cs
using System.Reflection;
using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.DependencyInjection;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Handler;

public class CommandHandler
{
    private readonly DiscordSocketClient _client;
    private readonly Dictionary<string, ISlashCommand> _commands;

    public CommandHandler(DiscordSocketClient client, IServiceProvider services)
    {
        _client = client;

        // Découverte automatique de toutes les ISlashCommand dans l'assembly
        _commands = Assembly.GetExecutingAssembly()
            .GetTypes()
            .Where(t => typeof(ISlashCommand).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract)
            .Select(t => (ISlashCommand)ActivatorUtilities.CreateInstance(services, t))
            .ToDictionary(cmd => cmd.Name);
    }

    public async Task RegisterCommandsAsync()
    {
        var slashCommands = _commands.Values.Select(cmd =>
        {
            var builder = new SlashCommandBuilder()
                .WithName(cmd.Name)
                .WithDescription(cmd.Description);

            if (cmd.Options.Length > 0)
            {
                builder.AddOptions(
                    cmd.Options.Select(option =>
                    {
                        var optionBuilder = new SlashCommandOptionBuilder()
                            .WithName(option.Name)
                            .WithDescription(option.Description)
                            .WithType(option.Type)
                            .WithRequired(option.IsRequired);

                        foreach (var (choiceName, choiceValue) in option.Choices)
                            optionBuilder.AddChoice(choiceName, (string)choiceValue);

                        return optionBuilder;
                    }).ToArray()
                );
            }

            if (cmd.RequiredPermission.HasValue)
                builder.WithDefaultMemberPermissions(cmd.RequiredPermission.Value);

            return builder.Build();
        }).ToArray();

        await _client.BulkOverwriteGlobalApplicationCommandsAsync(slashCommands);
    }

    public async Task HandleInteractionAsync(SocketInteraction interaction)
    {
        if (interaction is not SocketSlashCommand slashCommand)
            return;

        if (_commands.TryGetValue(slashCommand.CommandName, out var command))
            await command.ExecuteAsync(slashCommand);
    }
}