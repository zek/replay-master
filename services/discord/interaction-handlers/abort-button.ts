import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";

export class AbortButton extends InteractionHandler {
  constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  override parse(interaction: ButtonInteraction) {
    const {customId} = interaction
    if (customId === 'abort') {
      return this.some();
    }

    return this.none();
  }

  async run(interaction: ButtonInteraction) {
    await interaction.deferUpdate();

    await interaction.editReply({
      content: "Aborted!",
      components: [],
    });
  }
}
