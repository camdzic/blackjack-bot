import { GuardException } from "@/framework/exception/GuardException";
import { BaseGuard, type BaseGuardTypeMap } from "@/framework/guard/BaseGuard";
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

export class AndGuard extends BaseGuard<"any"> {
  private readonly guards: BaseGuard<keyof BaseGuardTypeMap>[];

  constructor(...guards: BaseGuard<keyof BaseGuardTypeMap>[]) {
    super({
      type: "any"
    });

    this.guards = guards;
  }

  async execute(
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
    const allowedGuards = this.guards.filter(g =>
      this.isSpecificGuard(g, this.getInteractionType(interaction))
    );

    for (const guard of allowedGuards) {
      try {
        await guard.execute(interaction);
      } catch {
        throw new GuardException(
          `Guard ${guard.constructor.name} failed in AndGuard`
        );
      }
    }
  }

  private isSpecificGuard(
    guard: BaseGuard<keyof BaseGuardTypeMap>,
    type: keyof BaseGuardTypeMap
  ): guard is BaseGuard<typeof type> | BaseGuard<"any"> {
    return guard.type === type || guard.type === "any";
  }

  private getInteractionType(
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
  ): keyof BaseGuardTypeMap {
    if (interaction.isChatInputCommand()) return "slashCommand";
    if (interaction.isMessageContextMenuCommand())
      return "messageContextMenuCommand";
    if (interaction.isUserContextMenuCommand()) return "userContextMenuCommand";
    if (interaction.isButton()) return "button";
    if (interaction.isStringSelectMenu()) return "stringSelectMenu";
    if (interaction.isChannelSelectMenu()) return "channelSelectMenu";
    if (interaction.isRoleSelectMenu()) return "roleSelectMenu";
    if (interaction.isMentionableSelectMenu()) return "mentionableSelectMenu";
    if (interaction.isUserSelectMenu()) return "userSelectMenu";

    throw new Error("Unknown interaction type");
  }
}
