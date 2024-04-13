# 🎮 Replay Master - Counter-Strike 2

Welcome to Replay Master, a Discord bot designed for Counter Strike 2 players. 
This bot makes it easy to record your game highlights by using a matchmaking sharecode.

## 🚀 Features
- **Automatic Recording**: Simply provide a sharecode, and the bot will capture your game highlights.
- **Simple Integration**: Effortlessly add Replay Master to your Discord server.
- **Quick Access to Highlights**: Easily view and share your recorded highlights directly on Discord.

Get started today and capture your best gaming moments with Replay Master!

## 🔧 Installation Guide

### Prerequisites

Install the following software using [Chocolatey](https://chocolatey.org/install), a package manager for Windows:

1. **Node.js**
   ```bash
   choco install nodejs
   ```
2. **ffmpeg**
   ```bash
   choco install ffmpeg
   ```
3. **Minio** - Local storage solution ([More Info & Download](https://min.io/download))

### Optional: Improve Decompression Time

For faster decompression of demo files, install `bzip2` and `gzip`:
- `choco install bzip2`
- `choco install gzip`

### Setup Steps

1. **Clone the Repository**
   Clone the repository to get the latest version of Replay Master.
   ```bash
   git clone https://github.com/your-username/cs2-replay-recorder.git
   ```
2. **Install Dependencies**
   Navigate to the cloned directory and install necessary npm packages.
   ```bash
   npm install
   ```
3. **Download HLAE Binaries**
   Download the required HLAE binaries for processing game replays.
   ([github.com/advancedfx/advancedfx](https://github.com/advancedfx/advancedfx))
   ```bash
   npm run download-hlae
   ```
4. **Generate Steam Refresh Token**
   Authenticate and generate the required STEAM_REFRESH_TOKEN for Steam access.
   ```bash
   npm run steam-login
   ```

### Configuring Discord Access

- Navigate to the [Discord Developer Portal](https://discord.com/developers/applications).
- Create a new application and note down the `CLIENT ID`.
- Under the Bot settings, add a bot and copy the `TOKEN` that is generated.

### Environment Configuration

Create a `.env` file with the following settings:

```
# Steam
STEAM_REFRESH_TOKEN=""

# Discord
DISCORD_TOKEN=""
DISCORD_CLIENTID=""

# Minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# FileSystem
REPLAY_DIR=data/

# HLAE
HLAE_DIR="./resources/hlae/"
FFMPEG_PATH="ffmpeg.exe"
CSGO_DIR="C:/Program Files (x86)/Steam/steamapps/common/Counter-Strike Global Offensive/game"
```

### Build and Start

```bash
npm run build
npm run start
```

## 📡 Services Overview

- **replay-downloader/replay-downloader**: Downloads CS2 match replays from remote URLs.
- **replay-downloader/replay-faceit**: Retrieves CS2 match replay URL using FaceIT API.
- **replay-downloader/replay-steam**: Retrieves CS2 match replay URL via Steam authentication.
- **replay-downloader/file**: Manages uploading and downloading of match replays via Minio.
- **replay-parser/replay-parser**: Analyzes match data from replays for structured insights.
- **replay-recorder**: Records and compiles CS2 replays into a video using HLAE.

### Running Specific Services

You can filter running services by defining following env variable. 

```
SERVICES="discord/*.service.js,http/api,replay-downloader/*.service.js" 
```

## 👥 Community and Contributions

Contributions to Replay Master are highly encouraged. 
If you're interested in improving the bot or adding new features, consider contributing to our project!

Inspired by [STRIKER](https://github.com/Run1e/STRIKER/).
