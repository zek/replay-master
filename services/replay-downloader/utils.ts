import type GlobalOffensive from "globaloffensive";
import type { MatchType, ReplayMeta} from "./types";
import { ReplayOrigin } from "./types";


export function matchToReplayMeta(match: GlobalOffensive.Match, matchToken: string): ReplayMeta {
  const playerCount = match.roundstatsall[0]?.reservation.account_ids.filter((id) => id !== 0)
    .length;
  const isWingman = playerCount && playerCount <= 4;
  const isPremier = match.roundstatsall[0]?.b_switched_teams;
  let type: MatchType;
  if (isWingman) {
    type = "wingman";
  } else if (isPremier) {
    type = "premier";
  } else {
    type = "competitive";
  }

  return {
    type,
    origin: ReplayOrigin.Valve,
    identifier: match.matchid,
    time: match.matchtime as number,
    replayUrl: match.roundstatsall.at(-1)!.map!,
    sharecode: matchToken,
  };
}
