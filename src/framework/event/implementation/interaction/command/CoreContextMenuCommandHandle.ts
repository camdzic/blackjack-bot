import type { BaseContextMenuCommandTypeMap } from "@/framework/command/BaseContextMenuCommand";
import { BaseEvent } from "@/framework/event/BaseEvent";
import { GuardException } from "@/framework/exception/GuardException";
import type { BaseGuard, BaseGuardTypeMap } from "@/framework/guard/BaseGuard";
import { ErrorEmbed } from "@/framework/utility/embeds/ErrorEmbed";
import { container } from "@/index";
import {
  type Interaction,
  type MessageContextMenuCommandInteraction,
  MessageFlags,
  type UserContextMenuCommandInteraction
} from "discord.js";

export class CoreContextMenuCommandHandle extends BaseEvent<"interactionCreate"> {
  constructor() {
    super({
      event: "interactionCreate"
    });
  }

  async execute(interaction: Interaction) {
    if (interaction.isMessageContextMenuCommand()) {
      await this.handleContextMenuCommand(
        interaction,
        "messageContextMenuCommand"
      );
    } else if (interaction.isUserContextMenuCommand()) {
      await this.handleContextMenuCommand(
        interaction,
        "userContextMenuCommand"
      );
    }
  }

  private async handleContextMenuCommand(
    interaction:
      | MessageContextMenuCommandInteraction
      | UserContextMenuCommandInteraction,
    type: keyof BaseContextMenuCommandTypeMap
  ) {
    const contextMenuCommand = container.contextMenuCommands
      .filter(command => command.type === type)
      .find(command => command.name === interaction.commandName);

    if (!contextMenuCommand) {
      return interaction.reply({
        embeds: [new ErrorEmbed("Unable to find wanted context menu command")],
        flags: MessageFlags.Ephemeral
      });
    }

    if (contextMenuCommand.guards) {
      const failedGuards: any[] = [];
      const contextMenuCommandGuards = contextMenuCommand.guards.filter(g =>
        this.isSpecificGuard(g, type)
      );

      for (const guard of contextMenuCommandGuards) {
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
              "You cannot use this context menu command due to a lack of guards"
            )
          ],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    try {
      await contextMenuCommand.execute(interaction);
    } catch {
      if (interaction.deferred || interaction.replied) {
        interaction.editReply({
          embeds: [
            new ErrorEmbed(
              `Failed to execute ${contextMenuCommand.constructor.name}, error will be reported`
            )
          ],
          components: []
        });
      } else {
        interaction.reply({
          embeds: [
            new ErrorEmbed(
              `Failed to execute ${contextMenuCommand.constructor.name}, error will be reported`
            )
          ],
          components: [],
          flags: MessageFlags.Ephemeral
        });
      }

      container.logger.error(
        `Failed to execute ${contextMenuCommand.constructor.name}`
      );
    }
  }

  private isSpecificGuard(
    guard: BaseGuard<keyof BaseGuardTypeMap>,
    type: keyof BaseGuardTypeMap
  ): guard is BaseGuard<typeof type> | BaseGuard<"any"> {
    return guard.type === type || guard.type === "any";
  }
}
