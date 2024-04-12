import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import type { KillsInfo , Player, ReplayEntity } from "../../replay-parser/types";
import { getKillsInfo } from "../../replay-parser/utils";
import { TableBuilder } from "./table";


export class RoundView {

  constructor(
    protected replay: ReplayEntity,
    protected player: Player,
    protected half: string,
  ) {
  }

  render(): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const metadata = this.replay.metadata;
    const halfIndex = parseInt(this.half, 10);
    const half = metadata.halves[halfIndex];

    metadata.halves.forEach((half, index) => {
      if (index % 5 === 0) {
        rows.push(new ActionRowBuilder<ButtonBuilder>());
      }
      const button = new ButtonBuilder()
        .setCustomId(`player.${this.replay.identifier}.${this.player.steamId}.${index}`)
        .setLabel(`Half ${index + 1}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(halfIndex === index);
      rows[rows.length - 1].addComponents(button);
    });

    let roundButtonRow = new ActionRowBuilder<ButtonBuilder>();
    let buttonCount = 0;

    for (const [roundNumber, round] of Object.entries(half.rounds)) {
      const hasKills = round.filter(death => death.attacker === this.player.steamId).length > 0;

      if (buttonCount >= 5) {
        rows.push(roundButtonRow);
        roundButtonRow = new ActionRowBuilder<ButtonBuilder>();
        buttonCount = 0;
      }

      roundButtonRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`round.${this.replay.identifier}.${this.player.steamId}.${roundNumber}`)
          .setLabel(`Round ${roundNumber}`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!hasKills),
      );
      buttonCount++;
    }

    if (buttonCount > 0) {
      rows.push(roundButtonRow);
    }

    const abortRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("abort")
          .setLabel("Abort")
          .setStyle(ButtonStyle.Danger),
      );

    rows.push(abortRow);

    return rows;
  }

  generateEmbed(): EmbedBuilder {
    const match = this.replay.metadata;

    const embed = new EmbedBuilder()
      .setTitle(`Select a round you want to record`)
      .setDescription(`Table of ${this.player.name}'s frags on ${match.headers.map_name}.`)

    const tableData = this.createTable();
    embed.addFields({
      name: "Match Details",
      value: tableData,
    });

    return embed;
  }

  createTable(): string {
    const metadata = this.replay.metadata;
    const halfIndex = parseInt(this.half, 10);
    const half = metadata.halves[halfIndex];

    const tableBuilder = new TableBuilder<KillsInfo>([
      { index: 0, label: "Round", width: 8, field: "round" },
      { index: 1, label: "Kills", width: 29, field: "kills" },
      { index: 2, label: "Details", width: 29, field: "details" },
    ]);

    Object.entries(half.rounds).forEach(([round, kills]) => {
      const killsInfo = getKillsInfo(kills, parseInt(round, 10), this.player.steamId)
      if (killsInfo) {
        tableBuilder.addRows(killsInfo);
      }
    });

    return tableBuilder.build();
  }


}
