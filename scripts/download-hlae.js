#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const decompress = require("decompress");

const hlaePath = path.join(__dirname, "/../resources/hlae");
const releasesUrl = `https://api.github.com/repos/advancedfx/advancedfx/releases/latest`;

async function downloadAdvancedFx() {
  try {
    console.log("Fetching latest release information...");
    const response = await fetch(releasesUrl);
    if (!response.ok) {
      throw new Error(`GitHub API responded with status ${response.status}`);
    }

    const latestRelease = await response.json();
    const asset = latestRelease.assets[0];

    if (!asset) {
      throw new Error("No assets found in the latest release.");
    }

    const downloadUrl = asset.browser_download_url;
    const outputPath = path.join(hlaePath, asset.name);

    await fs.mkdir(hlaePath, { recursive: true });

    console.log(`Downloading ${asset.name} from ${downloadUrl}...`);
    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download the asset, status code: ${downloadResponse.status}`);
    }

    await fs.writeFile(outputPath, downloadResponse.body);
    console.log(`Downloaded ${asset.name} to ${outputPath}`);

    if (outputPath.endsWith(".zip")) {
      console.log(`Extracting ${asset.name} to ${hlaePath}...`);
      await decompress(outputPath, hlaePath);
      console.log(`Extracted ${asset.name} to ${hlaePath}`);
    }
  } catch (error) {
    console.error("Error downloading the latest release:", error);
  }
}

async function setFfmpegPath(ffmpegPath) {
  const ffmpegIniPath = path.join(hlaePath, "ffmpeg", "ffmpeg.ini");

  const fileContents = `; BEGIN FILE CONTENTS
[Ffmpeg]
Path=${ffmpegPath}
; END FILE CONTENTS`;

  await fs.writeFile(ffmpegIniPath, fileContents);
  console.log(`FFmpeg path set in ${ffmpegIniPath}`);
}

function findFFmpegInPath() {
  try {
    const command = process.platform === "win32" ? "where ffmpeg" : "which ffmpeg";
    const ffmpegPath = execSync(command).toString().trim();
    console.log(`Found FFmpeg at ${ffmpegPath}`);
    return ffmpegPath;
  } catch (error) {
    console.error("FFmpeg not found:", error);
    return null;
  }
}

async function main() {
  console.log("Starting download process...");
  await downloadAdvancedFx();
  const ffmpegPath = findFFmpegInPath();
  if (!ffmpegPath) {
    throw new Error("FFmpeg not found. Please install it manually into the resources/hlae/ffmpeg folder");
  }
  await setFfmpegPath(ffmpegPath);
  console.log("Download and setup complete.");
}

main().catch((error) => {
  console.error("An error occurred during execution:", error);
  process.exit(1);
});
