import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { ReplayEntity } from "../../replay-parser/types";

export class PlayerView {
  private replay: ReplayEntity;

  constructor(replay: ReplayEntity) {
    this.replay = replay;
  }

  render(): ActionRowBuilder<ButtonBuilder>[] {
    const match = this.replay.metadata;
    const teams = Object.values(match.halves[0].teams);

    const rows: ActionRowBuilder<ButtonBuilder>[] = teams.map((team) => new ActionRowBuilder<ButtonBuilder>({
      components: team.players.map(playerId => {
        const player = match.players.find(player => player.steamId === playerId)!;
        return new ButtonBuilder()
          .setCustomId(`player.${this.replay.identifier}.${player.steamId}`)
          .setLabel(player.name)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(false);
      }),
    }));

    rows.push(
      new ActionRowBuilder<ButtonBuilder>({
        components: [
          new ButtonBuilder()
            .setCustomId("abort")
            .setLabel("Abort")
            .setStyle(ButtonStyle.Danger),
        ],
      }),
    );

    return rows;
  }
}
