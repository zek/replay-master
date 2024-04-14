/* eslint-disable sonarjs/no-duplicate-string */
import { temporaryDirectory } from "./helpers/utils";
import type { ConcatOptions } from './types/index';
import fs from 'fs';
import fsp from 'node:fs/promises';
import { initFrames } from './helpers/init-frames';
import { renderFrames } from './helpers/render-frames';
import { transcodeVideo } from './helpers/transcode-video';
import { renderAudio } from './helpers/render-audio';


// eslint-disable-next-line no-empty-function
const noop = () => {};

const concat = async (opts: ConcatOptions) => {
  const {
    args,
    log = console.log,
    concurrency = 4,
    frameFormat = 'raw',
    cleanupFrames = true,
    transition,
    transitions,
    audio,
    videos,
    output,
    tempDir,
    verbose = false,
  } = opts;

  if (tempDir) {
    fs.mkdirSync(tempDir)
  }

  const temp = tempDir || temporaryDirectory();

  console.time('ffmpeg-concat');

  try {
    console.time('init-frames');
    const { frames, scenes, theme } = await initFrames({
      concurrency,
      videos,
      transition,
      transitions,
      outputDir: temp,
      frameFormat,
      renderAudio: !audio,
      verbose,
    });
    console.timeEnd('init-frames');

    console.time('render-frames');
    const framePattern = await renderFrames({
      outputDir: temp,
      frameFormat,
      frames,
      theme,
      onProgress: (p) => {
        log(`render ${(100 * p).toFixed(0)}%`);
      },
    });
    console.timeEnd('render-frames');

    console.time('render-audio');
    let concatAudioFile = audio;
    if (!audio && scenes.filter((s) => s.sourceAudioPath).length === scenes.length) {
      concatAudioFile = await renderAudio({
        log,
        scenes,
        outputDir: temp,
        fileName: 'audioConcat.mp3',
      });
    }
    console.timeEnd('render-audio');

    await transcodeVideo({
      args,
      log,
      framePattern,
      frameFormat,
      audio: concatAudioFile,
      output,
      theme,
      verbose,
      onProgress: (p) => {
        log(`transcode ${(100 * p).toFixed(0)}%`);
      },
    });
  } finally {
    if (cleanupFrames && !tempDir) {
      await fsp.rm(temp, {recursive: true, force: true});
    }
    console.timeEnd('ffmpeg-concat');
  }
};

export default concat;

export { default as transitions, type TransitionName } from './helpers/transitions-wrap';
export type { ConcatOptions, ExtractAudioOpts, FrameFormat, InitFramesOptions, InitSceneOptions, Log, Transition } from './types/index';
