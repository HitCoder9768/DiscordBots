# DiscordBots
Some bots for Discord using the Discordie API.

Bots included for the following tasks:
* Music player
* Translation // currently does not work due to an update to the API //
* 8Ball command
* Cleverbot
* Random cat

These will all require:
* Discordie
* Node.js
* npm (node package manager)

**If you do not have a bot set up already please go here:** https://discordapp.com/developers/applications/me

**How to get Node.js, npm and Discordie**

First off, get Node and npm

Windows and Mac: https://nodejs.org/en/

Linux: Use your package manager to get node. (for example, sudo pacman -S nodejs or sudo apt-get install nodejs) And then install npm (sudo pacman -S npm or sudo apt-get install npm). If you have problems then use the link listed above for nodejs.org

**To get Discordie;**

Windows; Open powershell and type the following: `npm install discordie`

Mac and Linux; Open a terminal and run `npm install discordie`

# Node requirements
Some of these scripts require different apis and node modules;

**Music Bot requirements:**
* `npm install ytdl-core`
* `npm install xmlhttprequest`

**Translator Bot requirements:**
* `npm install node-google-translate-skidz`

**Cleverbot Bot requirements:**
* `npm install cleverbot.io`

**Random Cat Bot requirements:**
* `npm install random-cat`
