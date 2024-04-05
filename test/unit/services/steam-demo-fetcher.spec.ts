import {Readable} from "stream";
import { Errors, ServiceBroker } from "moleculer";
import type { ServiceSchema } from "moleculer";
import TestService from "../../../services/demo-fetchers/steam-demo-fetcher.service";

const validToken = "CSGO-QG6OW-fKdvd-aAcSd-xzyWw-BfhLJ"

describe("Test 'steam-demo-fetcher' service", () => {
  const broker = new ServiceBroker({ logger: false });
  broker.createService(TestService as unknown as ServiceSchema);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());


  describe("Test 'steam-demo-fetcher.getMatch' action", () => {
    test("should return with replay url", async () => {
      const res = await broker.call("steam-demo-fetcher.getMatch", { token: validToken });
      expect(res).toStrictEqual({"demoUrl": "http://replay129.valve.net/730/003676362600158855257_1677101043.dem.bz2", "matchId": "3676355915042259074", "matchTime": 1711936628});
    });


    test("should reject an ValidationError", async () => {
      await expect(broker.call("steam-demo-fetcher.getMatch")).rejects.toThrow(Errors.ValidationError);
    });
  });

  describe("Test 'greeter.welcome' action", () => {
    test("should return with 'Welcome'", async () => {
      const res = await broker.call("steam-demo-fetcher.downloadMatch", { token: validToken });

      expect(res).toBeInstanceOf(Readable);
    });

    test("should reject an ValidationError", async () => {
      await expect(broker.call("steam-demo-fetcher.downloadMatch")).rejects.toThrow(Errors.ValidationError);
    });
  });
});
