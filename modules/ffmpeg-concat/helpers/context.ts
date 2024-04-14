import type { ResizeMode, Theme } from '../types/internal';
import type { FrameFormat } from '../types/index';
import GL from 'gl';
import { FrameWriter, createFrameWriter } from './frame-writer';
import { DrawOpts, getTransition } from './transition';

interface ContextOpts {
  frameFormat: FrameFormat;
  theme: Theme;
}

interface GLTransitionFn {
  name: string;
  draw: ({ imagePathFrom, imagePathTo, progress, params }: DrawOpts) => Promise<void>;
  dispose: () => void;
}

export interface Context {
  // @ts-ignore
  gl: WebGLRenderingContext & GL.StackGLExtension;
  width: number;
  height: number;
  frameWriter: FrameWriter;
  transition: GLTransitionFn | null;
  setTransition: ({ name, resizeMode }: { name: string; resizeMode?: ResizeMode }) => undefined;
  capture: (filePath: string) => Promise<void>;
  render: GLTransitionFn['draw'];
  flush: FrameWriter['flush'];
  dispose: GLTransitionFn['dispose'];
}

export const createContext = async (opts: ContextOpts) => {
  const { frameFormat, theme } = opts;

  const { width, height } = theme;

  const gl = GL(width, height);

  if (!gl) {
    console.error(
      'Failed to create OpenGL context. Please see https://github.com/stackgl/headless-gl#supported-platforms-and-nodejs-versions for compatibility.',
    );
    throw new Error('failed to create OpenGL context');
  }

  const frameWriter = await createFrameWriter({
    gl,
    width,
    height,
    frameFormat,
  });

  const ctx: Partial<Context> & { frameWriter: FrameWriter } = {
    gl,
    width,
    height,
    frameWriter,
    transition: undefined,
  };

  ctx.setTransition = ({ name, resizeMode }) => {
    if (ctx.transition) {
      if (ctx.transition.name === name) {
        return;
      }

      ctx.transition.dispose();
      ctx.transition = undefined;
    }

    ctx.transition = getTransition({
      gl,
      name,
      resizeMode,
    });
  };

  ctx.capture = ctx.frameWriter.write.bind(ctx.frameWriter);

  ctx.render = async (...args) => {
    if (ctx.transition) {
      return ctx.transition.draw(...args);
    }
  };

  ctx.flush = async () => {
    return ctx.frameWriter.flush();
  };

  ctx.dispose = async () => {
    if (ctx.transition) {
      ctx.transition.dispose();
      ctx.transition = undefined;
    }

    gl.getExtension('STACKGL_destroy_context')?.destroy();
  };

  return ctx as Context;
};
