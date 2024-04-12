import type { Context, Service, ServiceSchema } from "moleculer";
import type { DbAdapter, DbServiceSettings, MoleculerDbMethods } from "moleculer-db";
import type MongoDbAdapter from "moleculer-db-adapter-mongo";
import type { DbServiceMethods } from "../../mixins/db.mixin";
import DbMixin from "../../mixins/db.mixin";
import type { DiscordTaskEntity } from "./types";


export type ActionCreateParams = Partial<DiscordTaskEntity>;

interface DiscordTasksSettings extends DbServiceSettings {
  indexes?: Record<string, number>[];
}

interface ServiceThis extends Service<DiscordTasksSettings>, MoleculerDbMethods {
  adapter: DbAdapter | MongoDbAdapter;
}

const DiscordTasksService: ServiceSchema<DiscordTasksSettings> & { methods: DbServiceMethods } = {
  name: "discord-tasks",
  // version: 1

  /**
   * Mixins
   */
  mixins: [DbMixin("discord-tasks")],

  /**
   * Settings
   */
  settings: {
    // Available fields in the responses
    // fields: ["_id", "guild_id", "channel_id", "user_id"],

    // Validator for the `create` & `insert` actions.
    entityValidator: {
      guildId: "string",
      channelId: "string",
      userId: "string",
    },

    indexes: [],
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
  methods: {},

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

export default DiscordTasksService;
