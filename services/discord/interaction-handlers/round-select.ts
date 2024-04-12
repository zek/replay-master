import fs from "fs";
import type { Readable } from "stream";
import { pipeline } from "stream/promises";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import type { Player, ReplayEntity } from "../../replay-parser/types";
import type { ActionReplayRecordParams, Highlight, HighlightRequest } from "../../replay-recorder/types";

interface InteractionParams {
  player: Player;
  replay: ReplayEntity;
  round: number;
}

export class RoundSelect extends InteractionHandler {
  constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  override async parse(interaction: ButtonInteraction) {
    const { customId } = interaction;
    if (customId.startsWith("round.")) {
      const [, identifier, player, round] = customId.split(".");
      const replays = await this.container.broker.call<ReplayEntity[], Partial<ReplayEntity>>("replays.find", {
        identifier,
      });
      const replay = replays[0];

      if (!replay) {
        await interaction.update({ content: "Replay not found" });
        return this.none();
      }

      return this.some<InteractionParams>(
        {
          replay,
          player: replay.metadata.players.find((p) => p.steamId === player)!,
          round: parseInt(round, 10),
        },
      );
    }

    return this.none();
  }

  async run(interaction: ButtonInteraction, { player, replay, round }: InteractionParams) {
    await interaction.deferUpdate();

    await interaction.editReply({
      content: "Demo recording queued",
    });

    const { replayUrl, origin, sharecode } = replay;

    await this.container.broker.waitForServices(['replay-recorder']);

    const highlight = await this.container.broker.call<Highlight, HighlightRequest>("replay-recorder.single-highlight", {     
      roundId: round,
      steamId: player.steamId,
      replayUrl,
      sharecode,
      origin,
    });


    const recording = await this.container.broker.call<Readable, ActionReplayRecordParams>("replay-recorder.record", {
      highlight,
      replayUrl: replay.replayUrl,
      sharecode: replay.sharecode,
      origin: replay.origin,
    });

    await pipeline(recording, fs.createWriteStream('./output.mp4'))
    await interaction.channel?.send({
      content: highlight.title,
      files: [{
        attachment: './output.mp4',
        name: `${player.name}.mp4`
      }],
    });

  }
}
