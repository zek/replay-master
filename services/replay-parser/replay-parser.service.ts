import { parseEvents, parseHeader } from "@laihoe/demoparser2";
import type { Context, ServiceBroker, ServiceSettingSchema } from "moleculer";
import { Service } from "moleculer";
import getReplayPath from "../../utils/get-replay-path";
import type { ActionReplayParseParams, MatchHalf, Player, ReplayParsed } from "./types";

interface Event {
  [key: string]: any;
  tick: number;
  event_name: string;
}

const EVENT_NAMES = ["server_cvar", "player_death", "announce_phase_end", "player_spawn", "player_team", "round_end", "round_start"];
const PLAYER_EXTRA_FIELDS = ["last_place_name", "X", "Y", "Z", "team_num", "user_id"];
const OTHER_EXTRA_FIELDS = ["is_warmup_period", "team_rounds_total", "rounds_played_this_phase", "total_rounds_played"];

interface ServiceSettings extends ServiceSettingSchema {
  replayDir: string;
}

export default class ReplayParserService extends Service<ServiceSettings> {

  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: "replay-parser",
      settings: {
        replayDir: process.env.REPLAY_DIR || "./data/replays/",
      },
      actions: {
        parse: {
          params: {
            sharecode: { type: "string" },
            origin: { type: "string" },
            replayUrl: { type: "string" },
          },
          handler: this.parse,
        },
      },
    });
  }

  async parse(context: Context<ActionReplayParseParams>): Promise<ReplayParsed> {
    const path = await getReplayPath(context.params, this.broker, this.settings.replayDir);

    const players: { [key: string]: Player } = {};

    const halves: MatchHalf[] = [{ teams: {}, rounds: {} }];
    const convars: { [key: string]: string } = {};

    const allEvents: Event[] = parseEvents(path, EVENT_NAMES, PLAYER_EXTRA_FIELDS, OTHER_EXTRA_FIELDS);
    const gameEndEvent = allEvents.findLast((event: any) => event.event_name === "round_end")!;
    convars.mp_maxrounds = gameEndEvent.round.toString();

    allEvents.forEach(event => {
      if (event.event_name === "server_cvar") {
        convars[event.name] = event.value;
        return;
      }
      const currentHalf = halves[halves.length - 1];
      const round = parseInt(event.total_rounds_played.toString(), 10) + 1;


      switch (event.event_name) {
      case "player_death":
        if (event.user_steamid === event.attacker_steamid) {
          break;
        }
        if (!currentHalf.rounds[round]) {
          currentHalf.rounds[round] = [];
        }
        currentHalf.rounds[round].push({
          tick: event.tick,
          attacker: event.attacker_steamid,
          attacker_team: event.attacker_team_num,
          attacker_place: event.attacker_last_place_name,
          victim: event.user_steamid,
          victim_team: event.user_team_num,
          victim_place: event.victim_last_place_name || null,
          thrusmoke: event.thrusmoke,
          weapon: event.weapon,
          pos: [event.user_X, event.user_Y, event.user_Z],
        });
        break;
      case "announce_phase_end":
        halves.push({ teams: {}, rounds: {} });
        break;
      case "player_spawn":
      case "player_team":
        if (event.disconnect || event.isbot || event.rounds_played_this_phase === 0) {
          break;
        }
        players[event.user_steamid] = {
          id: event.user_user_id,
          steamId: event.user_steamid,
          name: event.user_name,
        }
        if (!currentHalf.teams[event.user_team_num]) {
          currentHalf.teams[event.user_team_num] = {
            players: [],
          };
        }
        if (!currentHalf.teams[event.user_team_num].players.includes(event.user_steamid)) {
          currentHalf.teams[event.user_team_num].players.push(event.user_steamid);
        }

        break;
      default:
        break;
      }
    });


    return {
      convars,
      score: [gameEndEvent.ct_team_rounds_total, gameEndEvent.t_team_rounds_total],
      headers: {
        tickrate: 64,
        ...parseHeader(path),
      },
      players: Object.values(players).sort((a, b) => a.id - b.id),
      halves,
    };
  }


}
