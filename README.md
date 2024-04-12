# Replay Master - Counter-Strike 2

Welcome to Replay Master, a Discord bot designed for Counter Strike 2 players. 
This bot makes it easy to record your game highlights by using a matchmaking sharecode.

## Features
- **Automatic Recording**: Give the bot a sharecode, and it will record your game highlights.
- **Simple Integration**: Add Replay Master to your Discord server with minimal setup.
- **Quick Access to Highlights**: View your recorded highlights directly on Discord.

Start using Replay Master today to capture and share your best gaming moments!

## Prerequisites

We suggest using Chocolatey, a package manager for Windows, to simplify the software installation process. Refer to the [Chocolatey Installation Guide](https://chocolatey.org/install) for setup details.

1. Install NodeJS

```bash
choco install nodejs
```

2. Install ffmpeg

```bash
choco install ffmpeg
```

3. Install Minio (See https://min.io/download)

4. Recommended Software for Faster Decompression (optional)

To significantly improve the efficiency of decompressing demo files, consider installing `bzip2` and `gzip`. These tools can decrease the decompression time from 60 seconds to 8 seconds.

You can install these utilities via Chocolatey using the following commands:

- `choco install bzip2`
- `choco install gzip`

Using `bzip2` and `gzip` will make the process of decompressing demo files much faster, enhancing productivity.

## Installation

To use CS2 Replay Master, follow these steps:

1. Clone the repository to your local machine:

```bash
git clone https://github.com/your-username/cs2-replay-recorder.git
```

2. Install dependencies using npm:

```bash
npm install
```

3. Create .env file
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

4. Build and start service:

```bash
npm run build
npm run start
```

## Filtering Services

To run specific services, use the following command:
```
SERVICEDIR="dist/services" SERVICES="discord/*.service.js,http/api,replay-downloader/*.service.js" npx moleculer-runner -e
```

## Services
- **replay-downloader/replay-downloader**: Downloads and decompress CS2 match replays from remote URLs, providing an endpoint for clients to retrieve the replay files directly.
- **replay-downloader/replay-faceit**: Retrieves and returns of CS2 match replay url using FaceIT API
- **replay-downloader/replay-steam**: Retrieves and returns of CS2 match replay url using Steam authentication and APIs.
- **replay-downloader/file**: Minio file storage, provides uploading and downloading CS:GO match replay endpoints.
- **replay-parser/replay-parser**: Analyzes match data from CS2 replay files, including player events, scores, and match details, for structured analysis and use.
- **replay-recorder**: Records CS2 replays using HLAE, captures highlights, and merges them into a single video.

## Contributing

We welcome contributions from the community! If you'd like to contribute to CS2 Replay Master, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/new-feature`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature/new-feature`).
6. Create a new Pull Request.
