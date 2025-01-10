import type { BaseComponentTypeMap } from "@/framework/component/BaseComponent";
import { container } from "@/index";
import {
  ActionRowBuilder,
  type ButtonInteraction,
  type ChannelSelectMenuInteraction,
  type ChatInputCommandInteraction,
  type MentionableSelectMenuInteraction,
  type Message,
  type MessageActionRowComponentBuilder,
  type ModalMessageModalSubmitInteraction,
  type RoleSelectMenuInteraction,
  type StringSelectMenuInteraction,
  type UserContextMenuCommandInteraction,
  type UserSelectMenuInteraction
} from "discord.js";
import type { MessageContextMenuCommandInteraction } from "node_modules/discord.js/typings";

export function cleanExpiredComponents(
  interaction:
    | ChatInputCommandInteraction
    | MessageContextMenuCommandInteraction
    | UserContextMenuCommandInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction
    | ChannelSelectMenuInteraction
    | RoleSelectMenuInteraction
    | MentionableSelectMenuInteraction
    | UserSelectMenuInteraction
    | ModalMessageModalSubmitInteraction,
  message: Message,
  id: string
) {
  const updatedComponents = message.components.map(row =>
    ActionRowBuilder.from<MessageActionRowComponentBuilder>(row)
  );

  for (const row of updatedComponents) {
    for (const component of row.components) {
      //@ts-ignore
      if (component.data.custom_id === id) {
        component.setDisabled(true);
      }
    }
  }

  if (Date.now() - interaction.createdTimestamp < 15 * 60 * 1000) {
    return interaction.editReply({ components: updatedComponents });
  }
}

export function deleteComponent(
  customId: string,
  type: keyof BaseComponentTypeMap
) {
  container.components = container.components.filter(
    component => component.id !== customId || component.type !== type
  );
}
