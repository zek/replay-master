import { type Context, Service, type ServiceBroker, type ServiceSettingSchema } from "moleculer";
import parseReplayUrl from "../../utils/parse-replay-url";
import type { ReplayMeta, ReplaySource, ReplaySteamGetParams } from "../replay-downloader/types";
import { ReplayOrigin } from "../replay-downloader/types";
import type { ActionReplayParseParams ,
  ReplayEntity,
  ReplayParsed,
  ReplayParseParams,
} from "./types";

interface ServiceSettings extends ServiceSettingSchema {
}

export default class ReplayInfoService extends Service<ServiceSettings> {

  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: "replay-info",
      settings: {},
      /* dependencies: [
        "replay-steam",
        "replay-faceit",
        "replay-parser",
        "replays",
      ], */
      actions: {
        get: {
          params: {
            url: { type: "string" },
          },
          handler: this.handler,
        },
      },
    });
  }

  async getReplayMeta(replaySource: ReplaySource): Promise<ReplayMeta|undefined> {
    switch (replaySource.origin) {
    case ReplayOrigin.Valve:
      return this.broker.call<ReplayMeta, ReplaySteamGetParams>("replay-steam.get", {
        code: replaySource.sharecode,
      });
    case ReplayOrigin.Faceit:
      return this.broker.call<ReplayMeta, ReplaySteamGetParams>("replay-faceit.get", {
        code: replaySource.sharecode,
      });
    default:
      break;
    }
  }

  async handler(context: Context<ReplayParseParams>) {
    const replaySource = parseReplayUrl(context.params.url);

    if (!replaySource) {
      throw new Error("Replay not found");
    }

    const results = await this.broker.call<ReplayEntity[], any>("replays.find", {
      identifier: replaySource.sharecode,
    });

    if (results.length > 0) {
      return results[0];
    }

    const meta = await this.getReplayMeta(replaySource);
    if (!meta) {
      throw new Error("Replay not found");
    }

    const replayParsed = await this.broker.call<ReplayParsed, ActionReplayParseParams>("replay-parser.parse", meta);

    return this.broker.call<ReplayEntity, Partial<ReplayEntity>>("replays.create", {
      origin: meta.origin,
      time: meta.time,
      replayUrl: meta.replayUrl,
      identifier: meta.identifier,
      sharecode: meta.sharecode,
      game: "CS2",
      map: replayParsed.headers.map_name,
      metadata: replayParsed,
    });
  }

}
