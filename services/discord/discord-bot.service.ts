import path from "node:path";
import {ApplicationCommandRegistries, container, LogLevel, RegisterBehavior, SapphireClient} from "@sapphire/framework";
import {GatewayIntentBits} from "discord-api-types/v10";
import type {Client} from "discord.js";
import type { ServiceBroker, ServiceSettingSchema} from "moleculer";
import {Service} from "moleculer";


interface ServiceSettings extends ServiceSettingSchema {
	token: string;
	clientId: string;
}

export default class DiscordBotService extends Service<ServiceSettings> {

  client: Client | undefined


  constructor(broker: ServiceBroker) {
    super(broker)

    this.parseServiceSchema({
      name: 'discord-bot',
      // dependencies: ['replay-info'],
      settings: {
        token: process.env.DISCORD_TOKEN || '',
        clientId: process.env.DISCORD_CLIENTID || '',
      },
      created: this.serviceCreated,
      started: this.serviceStarted,
      stopped: this.serviceStopped,
    })
  }

  serviceCreated() {

    ApplicationCommandRegistries.setDefaultGuildIds(null)
    ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);


    this.client = new SapphireClient({
      defaultPrefix: '/',
      // regexPrefix: /^(hey +)?bot[,! ]/i,
      shards: 'auto',
      caseInsensitiveCommands: true,
      logger: {
        level: LogLevel.Debug,
      },
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
      baseUserDirectory: path.join(__dirname),
      loadMessageCommandListeners: true,
    });

    container.broker = this.broker
  }

  async serviceStarted() {
    await this.client!.login(this.settings?.token);
  }

  async serviceStopped() {
    await this.client!.destroy();
  }

}

declare module '@sapphire/pieces' {
	interface Container {
		broker: ServiceBroker;
	}
}
