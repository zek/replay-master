import type { ReplaySource } from "../replay-downloader/types";

export interface Command {
	tick: number;
	commands: string[];
}

export type UserRecordingSettings = {
	audioBitrate: number;
	fps: number;
	crosshairCode: string;
	fragmovie: boolean;
	useDemoCrosshair: boolean;
}

export type Highlight = {
	playerId: string;
	title: string;
	startTick: number;
	endTick: number;
	skips: [number, number][];
	totalSeconds: number;
}

export type CS2ScriptOptions = {
	demoPath: string;
	tickrate: number;
	videoBitrate: number;
	captureDir: string;
	videoFilters?: string;
	unblockString: string;
	highlight: Highlight
} & UserRecordingSettings


export type HighlightRequest = Required<ReplaySource> & {
	roundId: number;
	steamId: string;
}

export type ActionReplayRecordParams = Required<ReplaySource> & Partial<UserRecordingSettings> & {
	highlight: Highlight;
}

