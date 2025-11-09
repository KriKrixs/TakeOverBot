# Changelog

All notable changes to `TakeOverBot` will be documented in this file.

Updates should follow the [Keep a CHANGELOG](https://keepachangelog.com/) principles.

## v0.1.2 - 09/11/2025

### To Implement
- MongoDB package upgrade to version 7

### Added
- GlitchTip (Sentry) integration
- Custom Exceptions:
  - CommandNotFoundException
  - MalformedCommandException
  - UnauthorizedCommandException
- Login timeout
  - Discord
  - MongoDB
- Crash handler so the bot has time to send the error to GlitchTip
- Handle possible malformed Instagram and YouTube API responses.
- Role website updater

### Fixed
- Bot not starting fully due to events being fired before the listener is initialized.

### Changed
- Bot now crash if:
  - It can't load commands or commands files are malformed.
  - It can't connect to Discord.
  - It can't connect to MongoDB.
- Handle potential MongoDB errors in EmergencyListener.
- "ERROR" logs are renamed "CRITICAL"
- SendCommand now send only one message instead of 2 in case the user is not authorized to use the command.
- Upgraded dependencies:
  - `discord.js` from 14.17.3 to 14.24.2
  - `mongodb` from 6.13.0 to 6.20.0

### Removed
- Useless console.log() in YouTubeWatcher and InstagramWatcher.
- Useless code comment.
- Log file

## v0.1.1 - 09/10/2025

### Added
- Docker image
- [WIP] Role website updater

### Fixed
- YouTube and Instagram watcher crashing the entire bot

### Changed
- Convert config.json to .env

### Removed
- Steam client

## v0.1.0 - 24/05/2025

### Added
- Auto post new Instagram Post or Reel on a specific discord channel
- Auto post new YouTube videos or shorts on a specific discord channel
- DOM Parser package
- GuildMessageReactions Discord client's intent
- Emergency Listener V1 (User send messages on a specific channel, if the channel was inactive for X minutes, bot ask all the users if it's a real emergency. Yes => Bot pings everyone, No => Bot delete messages)
- Command "/send" to allow a user with a specific role to send messages as the bot.
- [WIP] Add role based on reactions on bot's messages.
- CreateIndex MongoDB client

### Changed
- UserJoinLeave is now UserJoinLeaveListener

### Removed
- Some useless console.log()

## v0.0.2 - 11/02/2025

### Added
- Auto add "Visiteur" role when rules are accepted

### Fixed
- Date time not displaying correctly when on embeds

## v0.0.1 - 07/02/2025

### Added
- `/ping` Pong !
- Listener on member entry
- Listener on rules accepted by the new member
- Welcome message when new member accepted the rules
- Discord.JS 14
- MongoDB 6 (Don't know if i will keep it)
