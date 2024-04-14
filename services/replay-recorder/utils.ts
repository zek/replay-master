import { execa } from "execa";

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