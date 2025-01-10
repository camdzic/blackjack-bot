import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  ModalMessageModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction
} from "discord.js";

export type BaseComponentTypeMap = {
  button: ButtonInteraction;
  stringSelectMenu: StringSelectMenuInteraction;
  channelSelectMenu: ChannelSelectMenuInteraction;
  roleSelectMenu: RoleSelectMenuInteraction;
  mentionableSelectMenu: MentionableSelectMenuInteraction;
  userSelectMenu: UserSelectMenuInteraction;
  modal: ModalMessageModalSubmitInteraction;
};

export type BaseComponent<T extends keyof BaseComponentTypeMap> = {
  id: string;
  type: T;
  allowedExecutorIds: string[];
  executionThreshold: number;
  renewOnInteract: boolean;
  timeout: Timer;
  execute(interaction: BaseComponentTypeMap[T], stop: () => void): unknown;
  expiredExecute?(id: string): unknown;
};
