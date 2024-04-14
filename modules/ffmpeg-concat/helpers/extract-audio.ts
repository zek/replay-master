import type { ExtractAudioOpts } from "../types";
import ffmpeg from 'async-ffmpeg';

export const extractAudio = (opts: ExtractAudioOpts) => {
  const { videoPath, outputFileName, start, duration } = opts;
  return ffmpeg({ input: videoPath, audioCodec: 'libmp3lame', debug: true, inputSeeking: start, duration, output: outputFileName });
};
