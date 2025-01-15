import type { BaseComponentTypeMap } from "@/framework/component/BaseComponent";
import { BaseEvent } from "@/framework/event/BaseEvent";
import { deleteComponent } from "@/framework/utility/Component";
import { ErrorEmbed } from "@/framework/utility/embeds/ErrorEmbed";
import { container } from "@/index";
import {
  type ButtonInteraction,
  type ChannelSelectMenuInteraction,
  type Interaction,
  type MentionableSelectMenuInteraction,
  MessageFlags,
  type ModalMessageModalSubmitInteraction,
  type RoleSelectMenuInteraction,
  type StringSelectMenuInteraction,
  type UserSelectMenuInteraction
} from "discord.js";

export class CoreComponentHandle extends BaseEvent<"interactionCreate"> {
  constructor() {
    super({
      event: "interactionCreate"
    });
  }

  async execute(interaction: Interaction) {
    if (interaction.isButton()) {
      await this.handleComponent(interaction, "button");
    } else if (interaction.isStringSelectMenu()) {
      await this.handleComponent(interaction, "stringSelectMenu");
    } else if (interaction.isChannelSelectMenu()) {
      await this.handleComponent(interaction, "channelSelectMenu");
    } else if (interaction.isRoleSelectMenu()) {
      await this.handleComponent(interaction, "roleSelectMenu");
    } else if (interaction.isMentionableSelectMenu()) {
      await this.handleComponent(interaction, "mentionableSelectMenu");
    } else if (interaction.isUserSelectMenu()) {
      await this.handleComponent(interaction, "userSelectMenu");
    } else if (interaction.isModalSubmit() && interaction.isFromMessage()) {
      await this.handleComponent(interaction, "modal");
    }
  }

  async handleComponent(
    interaction:
      | ButtonInteraction
      | StringSelectMenuInteraction
      | ChannelSelectMenuInteraction
      | RoleSelectMenuInteraction
      | MentionableSelectMenuInteraction
      | UserSelectMenuInteraction
      | ModalMessageModalSubmitInteraction,
    type: keyof BaseComponentTypeMap
  ) {
    const component = container.components
      .filter(c => c.type === type)
      .find(c => c.id === interaction.customId);

    if (!component) return;

    if (
      component.allowedExecutorIds.length &&
      !component.allowedExecutorIds.includes(interaction.user.id)
    ) {
      interaction.reply({
        embeds: [
          new ErrorEmbed("This component is meant for someone else to execute")
        ],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    try {
      const stop = () => {
        if (component.expiredExecute) {
          component.expiredExecute(component.id);
        }
        clearTimeout(component.timeout);
        deleteComponent(component.id, type);
      };

      await component.execute(interaction, stop);

      if (component.renewOnInteract) {
        clearTimeout(component.timeout);

        component.timeout = setTimeout(() => {
          if (component.expiredExecute) {
            component.expiredExecute(component.id);
          }

          deleteComponent(component.id, type);
        }, component.executionThreshold);
      } else {
        stop();
      }
    } catch (error) {
      if (interaction.deferred || interaction.replied) {
        interaction.editReply({
          embeds: [
            new ErrorEmbed(
              `Failed to execute ${type} component, error will be reported`
            )
          ],
          components: []
        });
      } else {
        interaction.reply({
          embeds: [
            new ErrorEmbed(
              `Failed to execute ${type} component, error will be reported`
            )
          ],
          components: [],
          flags: MessageFlags.Ephemeral
        });
      }

      container.logger.error(`Failed to execute ${type} component`);
      container.logger.error(error);
    }
  }
}
