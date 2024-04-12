import { decodeMatchShareCode } from "csgo-sharecode";
import GlobalOffensive from "globaloffensive";
import type { Context, ServiceBroker, ServiceSettingSchema } from "moleculer";
import { Service } from "moleculer";
import SteamUser from "steam-user";
import type { WebMeta } from "../types";
import type { ReplayMeta, ReplaySteamGetParams } from "./types";
import { ReplayOrigin } from "./types";


interface ServiceSettings extends ServiceSettingSchema {
  refreshToken: string;
}

interface MatchList {
  [matchId: string]: ((match: GlobalOffensive.Match) => void)[];
}


export default class ReplaySteamService extends Service<ServiceSettings> {

  protected matches: MatchList = {};

  protected steamUser: SteamUser = new SteamUser();

  protected csgo = new GlobalOffensive(this.steamUser);

  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: "replay-steam",
      settings: {
        refreshToken: process.env.STEAM_REFRESH_TOKEN || "",
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
          handler: this.handler,
        },
      },
      created: this.created,
      started: this.started,
      stopped: this.stopped,
    });
  }

  async authenticate(): Promise<void> {
    this.logger.info("Authenticating Steam...");
    // @ts-ignore only way to access `connecting` is private property access.
    if (this.steamUser.steamID || this.steamUser._connecting) {
      return;
    }
    const waitForAuthentication = new Promise((resolve) => {
      this.steamUser.once("loggedOn", resolve);
    });
    this.steamUser.on("error", this.logger.error);
    this.steamUser.logOn({
      refreshToken: this.settings.refreshToken,
    } as any);
    await waitForAuthentication;

    const waitForGame = new Promise((resolve) => {
      this.steamUser.once("appLaunched", (id: number) => id === 730 && resolve(id));
    });
    this.steamUser.gamesPlayed(730, true);
    await waitForGame;

    await new Promise((resolve) => {
      this.csgo.once("connectedToGC", () => resolve(true));
    });
  }

  async _getMatch(matchToken: string, timeoutMs = 5_000): Promise<ReplayMeta> {
    await this.authenticate();

    this.logger.info(`Getting match: ${matchToken}`);

    return new Promise((resolve, reject) => {
      try {
        const timeout = setTimeout(() => {
          reject(new Error("Timed out waiting for match URL"));
        }, timeoutMs);
        const info = decodeMatchShareCode(matchToken);

        if (!info) {
          reject(new Error("Invalid match token"));
          return;
        }
        const matchId = info.matchId.toString();

        if (!this.matches[matchId]) {
          this.matches[matchId] = [];
        }

        this.matches[matchId].push((match) => {
          resolve({
            origin: ReplayOrigin.Valve,
            identifier: match.matchid,
            time: match.matchtime as number,
            replayUrl: match.roundstatsall.at(-1)!.map!,
            sharecode: matchToken,
          } as ReplayMeta);
          clearTimeout(timeout);
        });

        this.csgo.requestGame(matchToken);
      } catch (err) {
        reject(err);
      }
    });
  }

  async logout(): Promise<void> {
    const waitForQuit = new Promise((resolve) => {
      this.steamUser.once("appQuit", (id: number) => id === 730 && resolve(id));
    });
    this.steamUser.gamesPlayed([], true);
    await waitForQuit;
    this.steamUser.logOff();
  }

  async handler(ctx: Context<ReplaySteamGetParams, WebMeta>): Promise<ReplayMeta> {
    const { code } = ctx.params;
    try {
      return await this._getMatch(code);
    } catch (error) {
      this.logger.error("Error getting match:", error.message);
      this.logger.error(error);
      ctx.meta.$statusCode = 500;
      throw error;
    }
  }

  created() {
    this.csgo.on("matchList", (matches: GlobalOffensive.Match[]) => {
      for (const match of matches) {
        if (this.matches[match.matchid]) {
          for (const callback of this.matches[match.matchid]) {
            callback(match);
          }
          delete this.matches[match.matchid];
        } else {
          this.logger.warn("Ignoring unknown match with id", match.matchid);
        }
      }
    });
  }

  async started() {
    await this.authenticate();
  }

  async stopped() {
    await this.logout();
  }

}
