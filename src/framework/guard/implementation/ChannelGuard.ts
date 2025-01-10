import { GuardException } from "@/framework/exception/GuardException";
import { BaseGuard } from "@/framework/guard/BaseGuard";
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

export class ChannelGuard extends BaseGuard<"any"> {
  private readonly channelIds: string[];
  private readonly requireAllChannels: boolean;

  constructor(requireAllChannels = true, ...channelIds: string[]) {
    super({
      type: "any"
    });

    this.channelIds = channelIds;
    this.requireAllChannels = requireAllChannels;
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
    const hasChannels = this.channelIds.every(
      channelId => interaction.channelId === channelId
    );

    if (this.requireAllChannels && !hasChannels) {
      throw new GuardException("Invalid channel");
    }

    if (!this.requireAllChannels && !hasChannels) {
      throw new GuardException("Invalid channel");
    }
  }
}
