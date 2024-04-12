import type { Context, Service, ServiceSchema } from "moleculer";
import type { DbAdapter, DbServiceSettings, MoleculerDbMethods } from "moleculer-db";
import type MongoDbAdapter from "moleculer-db-adapter-mongo";
import type { DbServiceMethods } from "../../mixins/db.mixin";
import DbMixin from "../../mixins/db.mixin";
import { ReplayOrigin } from "../replay-downloader/types";
import type { ReplayEntity } from "./types";

type ActionCreateParams = Partial<ReplayEntity>;

interface ReplaysSettings extends DbServiceSettings {
  indexes?: Record<string, number>[];
}

interface ServiceThis extends Service<ReplaysSettings>, MoleculerDbMethods {
  adapter: DbAdapter | MongoDbAdapter;
}

const ReplaysService: ServiceSchema<ReplaysSettings> & { methods: DbServiceMethods } = {
  name: "replays",
  // version: 1

  /**
   * Mixins
   */
  mixins: [DbMixin("replays")],

  /**
   * Settings
   */
  settings: {
    // Available fields in the responses
    // fields: ["_id", "game", "origin", "sharecode", "replayUrl", "map"],

    // Validator for the `create` & `insert` actions.
    entityValidator: {
      sharecode: { type: "string", optiona: true },
      origin: { type: "enum", values: Object.values(ReplayOrigin) },
      replayUrl: { type: "string" },
      identifier: { type: "string" },
      time: { type: "number", optional: true },
      game: { type: "string" },
      map: { type: "string" },
      metadata: {
        type: "object",
      }
    },

    indexes: [{ sharecode: 1 }],
  },

  /**
   * Action Hooks
   */
  hooks: {
    before: {
      create(ctx: Context<ActionCreateParams>) {

      },
    },
  },


  /**
   * Actions
   */
  actions: {},

  /**
   * Methods
   */
  methods: {
    /**
     * Loading sample data to the collection.
     * It is called in the DB.mixin after the database
     * connection establishing & the collection is empty.
     */
    async seedDB(this: ServiceThis) {
      /* await this.adapter.insertMany([
        { name: "Samsung Galaxy S10 Plus", quantity: 10, price: 704 },
        { name: "iPhone 11 Pro", quantity: 25, price: 999 },
        { name: "Huawei P30 Pro", quantity: 15, price: 679 },
      ]); */
    },
  },

  /**
   * Fired after database connection establishing.
   */
  async afterConnected(this: ServiceThis) {
    if ("collection" in this.adapter) {
      if (this.settings.indexes) {
        await Promise.all(
          this.settings.indexes.map((index) =>
            (<MongoDbAdapter>this.adapter).collection.createIndex(index),
          ),
        );
      }
    }
  },
};

export default ReplaysService;
