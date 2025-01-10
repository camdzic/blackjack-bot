import { GuardException } from "@/framework/exception/GuardException";
import { BaseGuard } from "@/framework/guard/BaseGuard";
import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  MentionableSelectMenuInteraction,
  MessageContextMenuCommandInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserContextMenuCommandInteraction,
  UserSelectMenuInteraction
} from "discord.js";

export class ChannelTypeGuard extends BaseGuard<"any"> {
  private readonly channelTypes: ChannelType[];

  constructor(...channelTypes: ChannelType[]) {
    super({
      type: "any"
    });

    this.channelTypes = channelTypes;
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

    if (!this.channelTypes.includes(interaction.channel.type)) {
      throw new GuardException("Invalid channel type");
    }
  }
}
