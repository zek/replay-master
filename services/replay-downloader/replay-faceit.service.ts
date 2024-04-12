import type { Context, ServiceBroker, ServiceSettingSchema } from "moleculer";
import { Service } from "moleculer";
import { fetch } from "undici";
import type { MatchResponse } from "./replay-faceit";
import type { ReplayMeta} from "./types";
import { ReplayOrigin } from "./types";

interface WebMeta {
	$statusCode: number;
	$responseType: string;
	$responseHeaders: Record<string, string>;
}

interface ActionMatchParams {
	code: string;
}

interface ServiceSettings extends ServiceSettingSchema {
	apiKey: string;
	timeout: number
}



export default class ReplayFaceitService extends Service<ServiceSettings> {


  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: "replay-faceit",
      settings: {
        apiKey: process.env.FACEIT_API_KEY || "",
        timeout: parseInt(process.env.FACEIT_API_TIMEOUT || '6000', 10)
      },
      actions: {
        get: {
          cache: true,
          rest: {
            method: "GET",
            path: "/:code",
          },
          params: {
            code: { type: "string" },
          },
          handler: this.getMatch,
        },
      },
    });
  }

  async getMatch(ctx: Context<ActionMatchParams, WebMeta>): Promise<ReplayMeta> {
    const { code } = ctx.params;
    const match = await this.request<MatchResponse>('GET', `/matches/${code}`);

    return {
      origin: ReplayOrigin.Faceit,
      replayUrl: match.demo_url[0],
      time: match.started_at,
      sharecode: match.match_id,
      identifier: match.match_id,
    } as ReplayMeta
  }


  private async request<T>(method: string, path: string): Promise<T> {
    const url = `https://open.faceit.com/data/v4${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(this.settings.timeout),
    });

    if (response.ok) {
      return (response.json() as Promise<T>);
    }

    const errorText = await response.text();
    throw new Error(`Faceit HTTP Error ${response.status}: ${errorText}`);
  }

}
