import type {Writable} from "stream";
import type { DefaultParams, TransitionName } from '../helpers/transitions-wrap';

export type FrameFormat = 'jpg' | 'png' | 'raw' | undefined;

export type Log = ((stdout?: string) => void) | undefined;

export interface ConcatOptions {
  audio?: string | undefined;
  cleanupFrames?: boolean | undefined;
  concurrency?: number | undefined;
  frameFormat?: FrameFormat;
  log?: Log;
  output: Writable;
  tempDir?: string | undefined;
  transition?: Transition | undefined;
  transitions?: ReadonlyArray<Transition> | undefined;
  videos: ReadonlyArray<string>;
  verbose?: boolean;
  args?: string[];
}

export interface Transition {
  duration: number;
  name: TransitionName;
  params?: DefaultParams;
}

export interface ExtractAudioOpts {
  videoPath: string;
  outputFileName: string;
  start: number;
  duration: number;
}

export interface InitFramesOptions extends Omit<InitSceneOptions, 'index' | 'video'> {
  concurrency?: number;
}

export interface InitSceneOptions {
  index: number;
  video: string;
  videos: ReadonlyArray<string>;
  transition?: Transition;
  transitions?: ReadonlyArray<Transition> | undefined;
  frameFormat: FrameFormat;
  outputDir: string;
  renderAudio: boolean;
  verbose?: boolean;
}
