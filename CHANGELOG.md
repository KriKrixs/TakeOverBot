# Changelog

All notable changes to `TakeOverBot` will be documented in this file.

Updates should follow the [Keep a CHANGELOG](https://keepachangelog.com/) principles.

## v0.1.1 - 09/10/2025

### Added
- Docker image
- [WIP] Role website updater

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
