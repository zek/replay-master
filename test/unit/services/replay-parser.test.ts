import { afterAll, beforeAll, describe, expect, test } from "vitest";

import fs from "fs";
import type { ServiceSchema } from "moleculer";
import { Errors, ServiceBroker } from "moleculer";
import superjson from "superjson";
import ReplayDownloaderService from "../../../services/replay-downloader/replay-downloader.service";
import ReplayFaceitService from "../../../services/replay-downloader/replay-faceit.service";
import ReplaySteamService from "../../../services/replay-downloader/replay-steam.service";
import { ReplayOrigin } from "../../../services/replay-downloader/types";
import TestService from "../../../services/replay-parser/replay-info.service";
import ReplayParserService from "../../../services/replay-parser/replay-parser.service";
import ReplaysService from "../../../services/replay-parser/replays.service";
import type { ActionReplayParseParams, ReplayEntity, ReplayParsed } from "../../../services/replay-parser/types";

describe("Test 'replay-parser' service", () => {
  const broker = new ServiceBroker({ logger: false });
  broker.createService(ReplayParserService);
  broker.createService(ReplayFaceitService);
  broker.createService(ReplaySteamService);
  broker.createService(ReplayDownloaderService);
  broker.createService(ReplaysService as unknown as ServiceSchema);
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());


  describe("Test 'replay-parser.parse' action", () => {


    // eslint-disable-next-line jest/no-commented-out-tests
    // test.skip("should record replay", async () => {
    //  const res = await broker.call<any, ActionReplayRecordParams>("replay-record.recorder", {
    //    origin: ReplayOrigin.Valve,
    //    sharecode: 'CSGO-QG6OW-fKdvd-aAcSd-xzyWw-BfhLJ',
    //    replayUrl: 'http://replay129.valve.net/730/003676362600158855257_1677101043.dem.bz2',
    //    highlight: {
    //
    //    }
    //  });
    //  const serialized = superjson.parse<ReplayParsed>(fs.readFileSync('test/data/valve.json').toString())
    //  expect(res).toEqual(serialized);
    // });


    test("should return with parsed replay", async () => {
      const res: ReplayParsed = await broker.call<ReplayParsed, ActionReplayParseParams>("replay-parser.parse", {
        origin: ReplayOrigin.Valve,
        sharecode: 'CSGO-QG6OW-fKdvd-aAcSd-xzyWw-BfhLJ',
        replayUrl: 'http://replay129.valve.net/730/003676362600158855257_1677101043.dem.bz2'
      });

      const serialized = superjson.parse<ReplayParsed>(fs.readFileSync('test/data/valve.json').toString())
      expect(res).toEqual(serialized);
    });

    test("should return with replay info from shortcode", async () => {
      const urls = [
        "steam://rungame/730/76561202255233023/+csgo_download_match CSGO-QG6OW-fKdvd-aAcSd-xzyWw-BfhLJ",
        "steam://rungame/730/76561202255233023/+csgo_download_match%20CSGO-QG6OW-fKdvd-aAcSd-xzyWw-BfhLJ",
        "CSGO-QG6OW-fKdvd-aAcSd-xzyWw-BfhLJ",
      ]
      for (const url of urls){
        const res : any = await broker.call("replay-info.get", {
          url,
        });
        delete res._id

        const metadata = superjson.parse<ReplayParsed>(fs.readFileSync('test/data/valve.json').toString())
        expect(res).toEqual({
          origin: ReplayOrigin.Valve,
          sharecode: 'CSGO-QG6OW-fKdvd-aAcSd-xzyWw-BfhLJ',
          replayUrl: 'http://replay129.valve.net/730/003676362600158855257_1677101043.dem.bz2',
          identifier: '3676355915042259074',
          game: 'CS2',
          map: 'de_mirage',
          time: 1711936628,
          metadata
        } as ReplayEntity);
      }
    }, 30_000);


    test("should reject an ValidationError", async () => {
      await expect(broker.call("replay-info.get")).rejects.toThrow(Errors.ValidationError);
    });

  });

});
