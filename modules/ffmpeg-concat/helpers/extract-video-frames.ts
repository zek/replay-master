import ffmpeg from 'fluent-ffmpeg';
import { Writable } from 'node:stream';

interface ExtractVideoFramesOpts {
  videoPath: string;
  framePattern: string | Writable;
  verbose?: boolean;
}

export const extractVideoFrames = (opts: ExtractVideoFramesOpts) => {
  const { videoPath, framePattern, verbose = false } = opts;
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(videoPath)
      // eslint-disable-next-line prettier/prettier
      .outputOptions([ 
        '-loglevel', 'info',
        '-pix_fmt', 'rgba',
        '-start_number', '0'
      ])
      .output(framePattern)
      //.on('start', (cmd) => console.log({ cmd }))
      .on('end', () => resolve(framePattern))
      .on('error', (err) => reject(err));

    if (verbose) {
      cmd.on('stderr', (err) => console.error(err));
    }

    cmd.run();
  });
};
