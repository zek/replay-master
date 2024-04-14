import createTransition from 'gl-transition';
import createBuffer from 'gl-buffer';
import createTexture from 'gl-texture2d';
import { getPixels } from './get-pixels';
import GL from 'gl';
import { ResizeMode } from '../types/internal';
import transitions from './transitions-wrap';

interface TransitionOpts {
  name: string;
  resizeMode?: ResizeMode;
  gl: WebGLRenderingContext & GL.StackGLExtension;
}

export interface DrawOpts {
  imagePathFrom: string;
  imagePathTo: string;
  progress: number;
  params: unknown;
}

export const getTransition = (opts: TransitionOpts) => {
  const { name = 'directionalwarp', resizeMode = 'stretch', gl } = opts;

  const buffer = createBuffer(gl, [-1, -1, -1, 4, 4, -1], gl.ARRAY_BUFFER, gl.STATIC_DRAW);

  const transitionName = name.toLowerCase();

  const source = transitions.find((t) => t.name.toLowerCase() === transitionName) || transitions.find((t) => t.name.toLowerCase() === 'fade');

  const transition = createTransition.default(gl, source, { resizeMode });

  return {
    name,
    draw: async ({ imagePathFrom, imagePathTo, progress, params }: DrawOpts) => {
      gl.clear(gl.COLOR_BUFFER_BIT);

      const dataFrom = await getPixels(imagePathFrom, {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
      });

      const textureFrom = createTexture(gl, dataFrom);
      textureFrom.minFilter = gl.LINEAR;
      textureFrom.magFilter = gl.LINEAR;

      const dataTo = await getPixels(imagePathTo, {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
      });

      const textureTo = createTexture(gl, dataTo);
      textureTo.minFilter = gl.LINEAR;
      textureTo.magFilter = gl.LINEAR;

      buffer.bind();
      transition.draw(progress, textureFrom, textureTo, gl.drawingBufferWidth, gl.drawingBufferHeight, params);

      textureFrom.dispose();
      textureTo.dispose();
    },

    dispose: () => {
      buffer.dispose();
      transition.dispose();
    },
  };
};
