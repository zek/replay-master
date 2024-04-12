import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import { ReplayEntity, ReplayParseParams } from "../../replay-parser/types";
import { DiscordTaskEntity } from "../types";
import { PlayerView } from "../views/player-view";

@ApplyOptions<Command.Options>({
  name: "record",
  description: "Record CS2 match highlight using a sharecode.",
})
export class RecordCommand extends Command {
  override async chatInputRun(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {

      const url = interaction.options.getString("url", true);
      await interaction.editReply(`Fetching match information for ${url}`);

      const replay = await this.container.broker.call<ReplayEntity, ReplayParseParams>("replay-info.get", {
        url,
      });

      if (!replay) {
        throw new Error(
          "Sorry, that's not a valid sharecode or FACEIT url.\n\n" +
          "You can give the bot matchmaking sharecodes from the CS2 client:\n" +
          "`steam://rungame/730/76561202255233023/+csgo_download_match%20CSGO-6K9On-pFzXs-9PGWH-2axWa-NP7rN`\n\n" +
          "(or just the sharecode itself: `CSGO-6K9On-pFzXs-9PGWH-2axWa-NP7rN`)\n\n" +
          "The bot also supports FACEIT matches:\n" +
          "`https://www.faceit.com/en/csgo/room/1-9fa1db69-5f1a-4ea3-a37c-3ab84fbd416a`",
        );
      }

      await this.container.broker.call<DiscordTaskEntity, Partial<DiscordTaskEntity>>("discord-tasks.create", {
        applicationId: interaction.applicationId,
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        userId: interaction.user.id,
        taskId: interaction.id,
      });

      const view = new PlayerView(replay);
      await interaction.editReply({ content: "Player Selection", components: view.render() });
    } catch (error) {
      await interaction.editReply({ content: `An error occurred while fetching the replay: ${error}` });
    }
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option =>
          option.setName("url")
            .setDescription("The matchmaking url to record highlights from.")
            .setRequired(true),
        ),
    );
  }

}
