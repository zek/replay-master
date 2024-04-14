import type { FrameFormat } from '../types/index';
import type { Frame, OnProgress, Theme } from '../types/internal';
import fs from 'node:fs/promises';
import path from 'node:path';
import pMap from 'p-map';
import { Context, createContext } from './context';

interface RenderFramesOpts {
  frameFormat: FrameFormat;
  frames: Frame[];
  outputDir: string;
  theme: Theme;
  onProgress: OnProgress;
}

export const renderFrames = async (opts: RenderFramesOpts) => {
  const { frameFormat, frames, onProgress, outputDir, theme } = opts;

  const ctx = await createContext({
    frameFormat,
    theme,
  });

  await pMap(
    frames,
    (frame, index) => {
      return renderFrame({
        ctx,
        frame,
        frameFormat,
        index,
        onProgress,
        outputDir,
        theme,
      });
    },
    {
      concurrency: 8,
    },
  );

  await ctx.flush();
  await ctx.dispose();

  return path.join(outputDir, `%012d.${frameFormat}`); // FRAMEPATTERN
};

interface RenderFrameOpts {
  ctx: Context;
  frame: Frame;
  frameFormat: FrameFormat;
  index: number;
  onProgress: OnProgress;
  outputDir: string;
  theme: Theme;
}

export const renderFrame = async (opts: RenderFrameOpts) => {
  const { ctx, frame, frameFormat, index, onProgress, outputDir, theme } = opts;

  const fileName = `${index.toString().padStart(12, '0')}.${frameFormat}`;
  const filePath = path.join(outputDir, fileName);

  const { current, next } = frame;

  const cFrame = index - current.frameStart;
  const cFramePath = current.getFrame(cFrame);

  if (next) {
    ctx.setTransition(current.transition);

    const nFrame = index - next.frameStart;
    const nFramePath = next.getFrame(nFrame);
    const cProgress = (cFrame - current.numFramesPreTransition) / current.numFramesTransition;

    await ctx.render({
      imagePathFrom: cFramePath,
      imagePathTo: nFramePath,
      progress: cProgress,
      params: current.transition.params,
    });

    await ctx.capture(filePath);
  } else {
    await fs.rename(cFramePath, filePath);
  }

  if (onProgress && index % 16 === 0) {
    onProgress(index / theme.numFrames);
  }
};
