import ffmpeg from 'fluent-ffmpeg';
import onTranscodeProgress from 'ffmpeg-on-progress';
import { Log } from '../types/index';
import { OnProgress, Theme } from '../types/internal';
import type { Writable } from "stream";

interface TranscodeVideoOpts {
  args?: string[];
  log: Log;
  audio?: string;
  frameFormat: string;
  framePattern: string;
  output: Writable | undefined;
  verbose: boolean;
  theme: Theme;
  onProgress: OnProgress;
}

export const transcodeVideo = async (opts: TranscodeVideoOpts) => {
  const { args, log, audio, frameFormat, framePattern, onProgress, output, theme, verbose } = opts;

  return new Promise<void>((resolve, reject) => {
    const inputOptions = ['-framerate', theme.fps.toString()];

    if (frameFormat === 'raw') {
      Array.prototype.push.apply(inputOptions, ['-vcodec', 'rawvideo', '-pixel_format', 'rgba', '-video_size', `${theme.width}x${theme.height}`]);
    }

    const cmd = ffmpeg(framePattern).inputOptions(inputOptions);

    if (audio) {
      cmd.addInput(audio);
    }

    const outputOptions = ['-hide_banner', '-map_metadata', '-1', '-map_chapters', '-1'];
    const videoOptions = args || [
      '-c:v',
      'libx264',
      '-profile:v',
      'main',
      '-preset',
      'medium',
      '-crf',
      '20',
      '-movflags',
      'frag_keyframe+empty_moov',
      '-pix_fmt',
      'yuv420p',
      '-r',
      theme.fps.toString(),
    ];

    const audioOptions = audio ? ['-c:a', 'copy'] : [];
    outputOptions.push(...videoOptions, ...audioOptions);

    if (onProgress) {
      cmd.on('progress', onTranscodeProgress(onProgress, theme.duration));
    }

    if (verbose) {
      cmd.on('stderr', (err) => console.error(err));
    }

    cmd
      .outputOptions(outputOptions)
      .outputFormat('mp4')
      .on('start', (cmd) => log && log(`cmd: ${cmd}`))
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .pipe(output, { end: true });
  });
};
