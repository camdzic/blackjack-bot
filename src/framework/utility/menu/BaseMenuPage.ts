import type { BaseMenu } from "@/framework/utility/menu/BaseMenu";
import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  InteractionEditReplyOptions,
  MentionableSelectMenuInteraction,
  ModalMessageModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction
} from "discord.js";

type Awaitable<T> = PromiseLike<T> | T;

export type BaseMenuPageRenderResult = InteractionEditReplyOptions & {
  content?: string | undefined;
};

export abstract class BaseMenuPage<T = unknown> {
  menu: BaseMenu<T>;

  setMenu(menu: BaseMenu<T>) {
    this.menu = menu;
  }

  get state() {
    return this.menu.state;
  }

  handleButton?(interaction: ButtonInteraction): unknown;
  handleStringSelectMenu?(interaction: StringSelectMenuInteraction): unknown;
  handleChannelSelectMenu?(interaction: ChannelSelectMenuInteraction): unknown;
  handleRoleSelectMenu?(interaction: RoleSelectMenuInteraction): unknown;
  handleMentionableSelectMenu?(
    interaction: MentionableSelectMenuInteraction
  ): unknown;
  handleUserSelectMenu?(interaction: UserSelectMenuInteraction): unknown;
  handleModal?(interaction: ModalMessageModalSubmitInteraction): unknown;

  abstract render(): Awaitable<BaseMenuPageRenderResult>;
}
