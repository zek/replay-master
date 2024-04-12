import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import type { Player , ReplayEntity } from "../../replay-parser/types";
import { RoundView } from "../views/round-view";

interface InteractionParams {
  player: Player
  replay: ReplayEntity
  half: string
}

export class PlayerSelect extends InteractionHandler {
  constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  override async parse(interaction: ButtonInteraction) {
    const { customId } = interaction;
    if (customId.startsWith("player.")) {
      const [, identifier, player, half = '0'] = customId.split(".");
      const replays = await this.container.broker.call<ReplayEntity[], Partial<ReplayEntity>>("replays.find", {
        identifier,
      });
      const replay = replays[0]

      return this.some<InteractionParams>(
        {
          replay,
          player: replay.metadata.players.find((p) => p.steamId === player)!,
          half,
        },
      );
    }

    return this.none();
  }

  async run(interaction: ButtonInteraction, { player, replay, half }: InteractionParams) {
    await interaction.deferUpdate();

    const view = new RoundView(replay, player, half);
    await interaction.editReply({
      components: view.render(),
      embeds: [view.generateEmbed()],
    });
  }
}
