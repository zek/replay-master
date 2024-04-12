import type { ReplaySource } from "../services/replay-downloader/types";
import { ReplayOrigin } from "../services/replay-downloader/types";

function extractSteamMatch(url: string): ReplaySource | undefined {
  const regex = /^(?:steam:\/\/rungame\/730\/\d+\/\+csgo_download_match )?(CSGO-([A-Za-z0-9]{5}-){4}[A-Za-z0-9]{5})$/;
  const match = decodeURI(url).match(regex);
  if (match && match[1]) {
    return {
      origin: ReplayOrigin.Valve,
      sharecode: match[1],
    };
  }
}

function extractReplayMatch(url: string): ReplaySource | undefined {
  const replay_match = url.match(
    /^http:\/\/replay\d{1,3}\.valve\.net\/730\/(\d*)_(\d*)\.dem\.bz2$/,
  );

  if (replay_match) {
    return {
      origin: ReplayOrigin.Valve,
      sharecode: replay_match[1].replace(/^0+/, ""),
      replayUrl: url,
    };
  }
}

function extractFaceitMatch(url: string): ReplaySource | undefined {
  const faceit_match = url.match(
    /^https:\/\/www.faceit.com\/\w{2}\/csgo\/room\/(\d-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})(\/scoreboard)?$/,
  );

  if (faceit_match) {
    return {
      origin: ReplayOrigin.Faceit,
      sharecode: faceit_match[1],
      replayUrl: url,
    };
  }
}

export default function parseReplayUrl(url: string): ReplaySource | undefined {
  url = url.trim();
  return extractSteamMatch(url) || extractFaceitMatch(url) || extractReplayMatch(url);
}