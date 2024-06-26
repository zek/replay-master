import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import type { Service, ServiceAsyncLifecycleHandler, ServiceEventHandler } from "moleculer";
import { Context, ServiceBroker } from "moleculer";
import DbService from "moleculer-db";
import DbMixin from "../../../mixins/db.mixin";

describe("Test DB mixin", () => {
  describe("Test schema generator", () => {
    const broker = new ServiceBroker({ logger: false, cacher: "Memory" });

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());


    test("check schema properties", () => {
      const schema = DbMixin("my-collection");

      expect(schema.mixins).toEqual([DbService]);
      expect(schema.adapter).toBeInstanceOf(DbService.MemoryAdapter);
      expect(schema.started).toBeDefined();
      expect(schema.events!["cache.clean.my-collection"]).toBeInstanceOf(Function);
    });

    test("check cache event handler", async () => {
      vi.spyOn(broker.cacher!, "clean");

      const schema = DbMixin("my-collection");

      await (schema.events!["cache.clean.my-collection"] as ServiceEventHandler).call(
        {
          broker,
          fullName: "my-service",
        },
        Context.create(broker),
      );


      expect(broker.cacher!.clean).toHaveBeenCalledTimes(1);
      expect(broker.cacher!.clean).toHaveBeenCalledWith("my-service.*");
    });

    describe("Check service started handler", () => {
      test("should not call seedDB method", async () => {
        const schema = DbMixin("my-collection");

        schema.adapter!.count = vi.fn(() => Promise.resolve(10));
        const seedDBFn = vi.fn();

        await (schema.started as ServiceAsyncLifecycleHandler).call({
          broker,
          logger: broker.logger,
          adapter: schema.adapter,
          seedDB: seedDBFn,
        } as unknown as Service);

        expect(schema.adapter!.count).toHaveBeenCalledTimes(1);
        expect(schema.adapter!.count).toHaveBeenCalledWith();

        expect(seedDBFn).toHaveBeenCalledTimes(0);
      });

      test("should call seedDB method", async () => {
        const schema = DbMixin("my-collection");

        schema.adapter!.count = vi.fn(() => Promise.resolve(0));
        const seedDBFn = vi.fn();

        await (schema.started as ServiceAsyncLifecycleHandler).call({
          broker,
          logger: broker.logger,
          adapter: schema.adapter,
          seedDB: seedDBFn,
        } as unknown as Service);

        expect(schema.adapter!.count).toHaveBeenCalledTimes(2);
        expect(schema.adapter!.count).toHaveBeenCalledWith();

        expect(seedDBFn).toHaveBeenCalledTimes(1);
        expect(seedDBFn).toHaveBeenCalledWith();
      });
    });

    test("should broadcast a cache clear event", async () => {
      const schema = DbMixin("my-collection");

      const ctx = Context.create(broker);

      vi.spyOn(ctx, "broadcast");

      await schema.methods!.entityChanged!("update", null, ctx);

      expect(ctx.broadcast).toHaveBeenCalledTimes(1);
      expect(ctx.broadcast).toHaveBeenCalledWith("cache.clean.my-collection");
    });
  });
});
