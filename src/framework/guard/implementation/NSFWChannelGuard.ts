import { GuardException } from "@/framework/exception/GuardException";
import { BaseGuard } from "@/framework/guard/BaseGuard";
import {
  type ButtonInteraction,
  type ChannelSelectMenuInteraction,
  ChannelType,
  type ChatInputCommandInteraction,
  type MentionableSelectMenuInteraction,
  type MessageContextMenuCommandInteraction,
  type RoleSelectMenuInteraction,
  type StringSelectMenuInteraction,
  type UserContextMenuCommandInteraction,
  type UserSelectMenuInteraction
} from "discord.js";

export class NSFWChannelGuard extends BaseGuard<"any"> {
  constructor() {
    super({
      type: "any"
    });
  }

  execute(
    interaction:
      | ChatInputCommandInteraction
      | MessageContextMenuCommandInteraction
      | UserContextMenuCommandInteraction
      | ButtonInteraction<"cached">
      | StringSelectMenuInteraction<"cached">
      | ChannelSelectMenuInteraction<"cached">
      | RoleSelectMenuInteraction<"cached">
      | MentionableSelectMenuInteraction<"cached">
      | UserSelectMenuInteraction<"cached">
  ) {
    if (!interaction.channel) return;

    if (
      interaction.channel.type === ChannelType.GuildText &&
      !interaction.channel.nsfw
    ) {
      throw new GuardException("Channel is not NSFW");
    }
  }
}
