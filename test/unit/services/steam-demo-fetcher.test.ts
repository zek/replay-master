import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { Errors, ServiceBroker } from "moleculer";
import type { ServiceSchema } from "moleculer";
import TestService from "../../../services/replay-downloader/replay-steam.service";

const code = "CSGO-QG6OW-fKdvd-aAcSd-xzyWw-BfhLJ"

describe("Test 'replay-steam' service", () => {
  const broker = new ServiceBroker({ logger: false });
  broker.createService(TestService as unknown as ServiceSchema);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());


  describe("Test 'replay-steam.get' action", () => {
    test("should return with premier match details", async () => {
      const res = await broker.call("replay-steam.get", { code });
      expect(res).toStrictEqual({
        "identifier": "3676355915042259074",
        "origin": "valve",
        "replayUrl": "http://replay129.valve.net/730/003676362600158855257_1677101043.dem.bz2",
        "sharecode": "CSGO-QG6OW-fKdvd-aAcSd-xzyWw-BfhLJ",
        "time": 1711936628,
        "type": "premier"
      });
    });


    test("should reject an ValidationError", async () => {
      await expect(broker.call("replay-steam.get")).rejects.toThrow(Errors.ValidationError);
    });
  });

});
