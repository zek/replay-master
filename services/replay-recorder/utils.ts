import fs from "fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { $, execa } from "execa";
import randomString from "../../utils/random-string";

const defaultFfmpegPath = "ffmpeg";

type ConcatOptions = {
  tempDir?: string;
  ffmpegPath?: string;
}

export async function concatVideos(videoFiles: string[], options: ConcatOptions = {}) {
  const jobId = randomString(10);
  const {
    tempDir = tmpdir(),
    ffmpegPath = defaultFfmpegPath,
  } = options;
  const partsFile = join(tempDir, `parts-${jobId}.txt`);
  await fs.writeFile(partsFile, videoFiles.map((file) => `file '${resolve(file)}'`).join("\n"));

  const process = $({ buffer: false, })`${ffmpegPath} -f concat -safe 0 -i ${partsFile} -c copy -y -f mp4 -movflags empty_moov -`;

  void process.once("exit", () => fs.rm(partsFile));

  return process.readable({binary: true,  preserveNewlines: false});
}

type MergeOptions = {
  ffmpegPath: string;
  audioBitrate?: number;
}

export async function mergeVideoAndAudio(video: string, audio: string, output: string, {
  audioBitrate = 192,
  ffmpegPath,
}: MergeOptions) {
  return execa(ffmpegPath, [
    "-i", video,
    "-i", audio,
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", `${audioBitrate}k`,
    "-y", output,
  ]);
}