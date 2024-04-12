import type { Death, HighlightResult, Kill, KillsInfo, MatchHalf } from "./types";


export function filterKillsByAttacker(kills: Death[], attacker: string): Death[] {
  return kills.filter(kill => kill.attacker === attacker);
}

export function getKillsInfo(kills: Death[], roundId: number, attacker : string|undefined = undefined): KillsInfo|undefined {
  if (attacker) {
    kills = filterKillsByAttacker(kills, attacker);
  }

  if (kills.length === 0) {
    return
  }

  let k = 0;
  let tk = 0;
  for (const kill of kills) {
    if (kill.attacker_team === kill.victim_team) {
      tk++;
    } else {
      k++;
    }
  }

  const info = [`${k}k`];
  if (tk) {
    info.push(`(${tk}tk)`);
  }

  info.push([...new Set(kills.map(kill => kill.weapon))].join(", "));

  return {
    round: `R${roundId}`,
    kills: info.join(" "),
    details: [...new Set(kills.map(kill => kill.attacker_place))].join(", "),
  };
}


export function getKillsByRound(data: MatchHalf[], roundId: number, attacker : string|undefined = undefined): Death[] {
  const half = data.find(half => half.rounds[roundId]);
  const kills = half ? half.rounds[roundId] : [];

  if (attacker) {
    return filterKillsByAttacker(kills, attacker);
  }
  return kills
}

export function singleHighlight(tickRate: number, kills: Kill[]): HighlightResult {
  const ADD_INTRO = 4;
  const ADD_OUTRO = 3;

  const ADD_BEFORE_KILL = 2.5;
  const ADD_AFTER_KILL = 1.5;

  const MAX_INTERLEAVE = 1;

  const startTick = kills[0].tick - Math.floor(tickRate * ADD_INTRO);
  const endTick = kills[kills.length - 1].tick + Math.floor(tickRate * ADD_OUTRO);

  let ticks = endTick - startTick;

  const skips: [number, number][] = [];

  if (kills.length > 1) {
    for (let i = 0; i < kills.length - 1; i++) {
      const end = kills[i].tick + Math.floor(tickRate * ADD_AFTER_KILL);
      const start = kills[i + 1].tick - Math.floor(tickRate * ADD_BEFORE_KILL);

      if (start - end > tickRate * (ADD_BEFORE_KILL + ADD_AFTER_KILL + MAX_INTERLEAVE)) {
        skips.push([end, start]);
        ticks -= start - end;
      }
    }
  }

  return {
    startTick,
    endTick,
    skips,
    totalSeconds: ticks / tickRate,
  };
}


export function calculateBitrate(
  duration: number,
  bitrateScalar: number = 0.7,
  maxBitrateMbit: number = 10,
  maxFileSizeMb: number = 25,
): number {
  const maxBitrate = maxBitrateMbit * 1024 * 1024; // Convert Mbit to bit
  const maxFileSize = maxFileSizeMb * 8 * 1024 * 1024; // Convert MB to bit
  return Math.min(maxBitrate, Math.floor((maxFileSize / duration) * bitrateScalar));
}


