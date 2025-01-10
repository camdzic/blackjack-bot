import { GuardException } from "@/framework/exception/GuardException";
import { BaseGuard } from "@/framework/guard/BaseGuard";
import { container } from "@/index";
import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  MentionableSelectMenuInteraction,
  MessageContextMenuCommandInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserContextMenuCommandInteraction,
  UserSelectMenuInteraction
} from "discord.js";

export class ServerOwnerGuard extends BaseGuard<"any"> {
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
    if (!interaction.inCachedGuild) {
      container.logger.warn(
        "While executing ServerOwnerGuard, guild was not found"
      );
      throw new GuardException(
        "While executing ServerOwnerGuard, guild was not found"
      );
    }

    if (!interaction.guild) {
      container.logger.warn(
        "While executing ServerOwnerGuard, guild was not found"
      );
      throw new GuardException(
        "While executing ServerOwnerGuard, guild was not found"
      );
    }

    if (interaction.guild.ownerId !== interaction.user.id) {
      throw new GuardException("You are not the owner of the server");
    }
  }
}
