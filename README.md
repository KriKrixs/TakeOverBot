# Discord Bot CSTracker

Discord server of "Les Plots" : [https://discord.gg/63gTsKFWQm](https://discord.gg/63gTsKFWQm)

This is a little discord bot that allows users to track their CS2 stats
You can add a webhook link in the config in order to have the logs of the bots into a discord channel.

## Command list

For now, the bot is focused on CS2 but is "designed" to add more games and platform

- `/ping` Pong !
- `/link {platform} {link}` Allow user to link their account on a platform
- `/steam {link}` Allow to get infos about user's steam profile or linked profile
- `/stats {game} {target} {user}` Allow to get stats on a game and a specific topic. A user can be selected otherwise it will be the user who executed the command.
- `/unlink {platform}` Unlink a platform account from the user

## Requirements

- Node 20
- A MongoDB Server

## Install

- Ensure you can access your MongoDB server
- Copy `config.json.template` to `config.json` and fill it
- Install the dependencies 

```bash
$ npm install
```
- Run the bot

```bash
$ npm start
```

## ChangeLog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

## Security

If you discover any security related issues, please create a new issue with the corresponding filters on [GitHub - Issues](https://github.com/KriKrixs/Discord-BOT-CSTracker/issues/new).
