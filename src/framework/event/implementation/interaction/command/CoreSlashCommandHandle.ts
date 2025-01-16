import { BaseEvent } from "@/framework/event/BaseEvent";
import { GuardException } from "@/framework/exception/GuardException";
import type { BaseGuard, BaseGuardTypeMap } from "@/framework/guard/BaseGuard";
import { ErrorEmbed } from "@/framework/utility/embeds/ErrorEmbed";
import { container } from "@/index";
import { DiscordAPIError, type Interaction, MessageFlags } from "discord.js";

export class CoreSlashCommandHandle extends BaseEvent<"interactionCreate"> {
  constructor() {
    super({
      event: "interactionCreate"
    });
  }

  async execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      const slashCommand = container.slashCommands.find(
        command => command.name === interaction.commandName
      );

      if (!slashCommand) {
        return interaction.reply({
          embeds: [new ErrorEmbed("Unable to find wanted slash command")],
          flags: MessageFlags.Ephemeral
        });
      }

      if (slashCommand.guards) {
        const failedGuards: any[] = [];
        const commandGuards = slashCommand.guards.filter(g =>
          this.isSpecificGuard(g, "slashCommand")
        );

        for (const guard of commandGuards) {
          try {
            await guard.execute(interaction);
          } catch (error) {
            if (error instanceof GuardException) {
              failedGuards.push(error.message);
            }
          }
        }

        if (failedGuards.length) {
          return interaction.reply({
            embeds: [
              new ErrorEmbed(
                "You cannot use this slash command due to a lack of guards"
              )
            ],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      try {
        await slashCommand.execute(interaction);
      } catch (error) {
        if (interaction.deferred || interaction.replied) {
          interaction.editReply({
            embeds: [
              new ErrorEmbed(
                `Failed to execute ${slashCommand.constructor.name}, error will be reported`
              )
            ],
            components: []
          });
        } else {
          interaction.reply({
            embeds: [
              new ErrorEmbed(
                `Failed to execute ${slashCommand.constructor.name}, error will be reported`
              )
            ],
            components: [],
            flags: MessageFlags.Ephemeral
          });
        }

        container.logger.error(
          `Failed to execute ${slashCommand.constructor.name}`
        );

        if (!(error instanceof DiscordAPIError)) {
          container.logger.error(error);
        }
      }
    } else if (interaction.isAutocomplete()) {
      const slashCommand = container.slashCommands.find(
        command => command.name === interaction.commandName
      );

      if (!slashCommand) return;

      if (slashCommand.autocompleteExecute) {
        try {
          await slashCommand.autocompleteExecute(interaction);
        } catch (error) {
          container.logger.error(
            `Failed to execute autocomplete for ${slashCommand.constructor.name}`
          );

          if (!(error instanceof DiscordAPIError)) {
            container.logger.error(error);
          }
        }
      }
    }
  }

  private isSpecificGuard(
    guard: BaseGuard<keyof BaseGuardTypeMap>,
    type: keyof BaseGuardTypeMap
  ): guard is BaseGuard<typeof type> | BaseGuard<"any"> {
    return guard.type === type || guard.type === "any";
  }
}
