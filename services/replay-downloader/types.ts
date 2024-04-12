export enum ReplayOrigin {
  Valve = "valve",
  Faceit = "faceit",
  Upload = "upload",
}

export interface ReplaySource {
  sharecode: string,
  origin: ReplayOrigin,
  replayUrl?: string
}

export type ReplayMeta = Required<ReplaySource> & {
  identifier: string,
  time: number;
}

export interface ActionDownloadParams {
  replayUrl: string;
}

export interface ReplaySteamGetParams {
  code: string;
}

export interface DownloadReplayOptions {
  objectName: string
  filePath: string
}

export interface UploadReplayOptions extends DownloadReplayOptions {}