import type GlobalOffensive from "globaloffensive";
import { request } from "undici";
import type { MatchType, ReplayMeta } from "./types";
import { ReplayOrigin } from "./types";

export interface MatchHistoryResponse {
  result: {
    nextcode: string;
  };
}

export type MatchRequest = {
  steamId: string,
  authCode: string,
  lastShareCode: string,
  steamApiKey: string,
  sleep?: number
}

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


export const getNextMatchCode = async ({
  authCode, lastShareCode, steamId, steamApiKey,
}: MatchRequest): Promise<string | null> => {
  const url = new URL("https://api.steampowered.com/ICSGOPlayers_730/GetNextMatchSharingCode/v1");
  url.searchParams.append("access_token", steamApiKey);
  url.searchParams.append("steamid", steamId);
  url.searchParams.append("steamidkey", authCode);
  url.searchParams.append("knowncode", lastShareCode);

  const response = await request(url, { method: "GET" });

  if (response.statusCode < 200 || response.statusCode > 299) {
    throw new Error(`Unexpected status code ${response.statusCode}. Response body: ${await response.body.text()}`);
  }

  const data: MatchHistoryResponse = await response.body.json() as MatchHistoryResponse;
  if (!data?.result?.nextcode || data.result.nextcode === "n/a") {
    return null;
  }
  return data.result.nextcode;
};

export async function* matchCodeGenerator(
  { steamId, steamApiKey, authCode, lastShareCode, sleep }: MatchRequest,
): AsyncGenerator<string, void> {
  let nextShareCode: string | null = lastShareCode;

  do {
    nextShareCode = await getNextMatchCode({
      steamId,
      authCode,
      lastShareCode: nextShareCode,
      steamApiKey,
    });
    if (nextShareCode) {
      yield nextShareCode;
    }

    if (sleep) {
      await new Promise(r => setTimeout(r, sleep));
    }
  }
  while (nextShareCode);
}



