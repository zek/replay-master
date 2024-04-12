import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';


@ApplyOptions<Command.Options>({
  name: 'help',
  description: 'Shows help information for using Replay Master',
})
export class HelpCommand extends Command {
  override async chatInputRun(interaction: CommandInteraction) {

    await interaction.deferReply({ ephemeral: true });

    const helpMessage = [
      '**Replay Master Help**',
      'This bot records your CS2 game highlights. Just give it a matchmaking sharecode, and it will make a video of the best parts of your match.',
      '',
      '**Commands:**',
      '/record <sharecode> - Records the CS:GO match highlights.',
      '/help - Shows this help message.'
    ].join('\n');

    await interaction.editReply({content: helpMessage});
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDMPermission(true)
    );
  }
}
