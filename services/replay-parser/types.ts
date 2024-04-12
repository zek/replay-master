import type { ReplayMeta, ReplaySource } from "../replay-downloader/types";

export interface ReplayParseParams {
  url: string;
}

export interface Team {
  players: string[];
}

export interface Death {
  tick: number;
  victim: string;
  victim_team: number;
  victim_place: string;
  attacker: string;
  attacker_team: number;
  attacker_place: string;
  pos: string[];
  weapon: string;
  thrusmoke: boolean;
}

export interface MatchHalf {
  teams: { [key: number]: Team };
  rounds: { [key: number]: Death[] };
}

export interface ReplayHeaders {
  map_name: string;
  network_protocol: string;
  server_name: string;
  tickrate: number;
}

export interface Player {
  id: number;
  steamId: string;
  name: string;
}

export interface ReplayParsed {
  convars: Record<string, string>;
  score: [number, number];
  headers: ReplayHeaders;
  players: Player[];
  halves: MatchHalf[];
}

export type ActionReplayParseParams = Required<ReplaySource>

export interface KillsInfo {
  round: string;
  kills: string;
  details: string;
}

export interface Kill {
  tick: number;
}

export interface HighlightResult {
  startTick: number;
  endTick: number;
  skips: [number, number][];
  totalSeconds: number;
}

export interface ReplayEntity extends ReplayMeta {
  _id: string;
  game: "CS2";
  map: string;
  metadata: ReplayParsed;
}
