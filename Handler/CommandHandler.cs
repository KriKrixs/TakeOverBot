// CommandHandler.cs
using System.Reflection;
using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.DependencyInjection;
using TakeOverBot.Commands;
using TakeOverBot.Interfaces;

namespace TakeOverBot.Handler;

public class CommandHandler
{
    private readonly DiscordSocketClient _client;
    private readonly Dictionary<string, ISlashCommand> _commands;

    public CommandHandler(DiscordSocketClient client, IServiceProvider services)
    {
        _client = client;

        // Instanciation de toutes les commandes sauf HelpCommand
        var commands = Assembly.GetExecutingAssembly()
            .GetTypes()
            .Where(t => typeof(ISlashCommand).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract && t != typeof(HelpCommand))
            .Select(t => (ISlashCommand)ActivatorUtilities.CreateInstance(services, t))
            .ToList();

        // HelpCommand reçoit la liste des autres commandes
        commands.Add(new HelpCommand(commands));

        _commands = commands.ToDictionary(cmd => cmd.Name);
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

        if (!_commands.TryGetValue(slashCommand.CommandName, out var command))
            return;

        if (command.AllowedRoleIds.Length > 0)
        {
            var guildUser = slashCommand.User as Discord.WebSocket.SocketGuildUser;
            var allowedRoleIds = command.AllowedRoleIds
                .Select(Environment.GetEnvironmentVariable)
                .Where(id => !string.IsNullOrEmpty(id))
                .ToHashSet();

            var hasRole = guildUser!.Roles.Any(r => allowedRoleIds.Contains(r.Id.ToString()));

            if (!hasRole)
            {
                await slashCommand.RespondAsync("❌ Tu n'es pas autorisé à utiliser cette commande.", ephemeral: true);
                return;
            }
        }

        await command.ExecuteAsync(slashCommand);
    }
}