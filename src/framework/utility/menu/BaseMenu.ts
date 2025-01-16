import { MenuException } from "@/framework/exception/MenuException";
import type { BaseMenuPage } from "@/framework/utility/menu/BaseMenuPage";
import { container } from "@/index";
import {
  ActionRowBuilder,
  type CollectedInteraction,
  InteractionCollector,
  type InteractionResponse,
  type Message,
  type MessageActionRowComponentBuilder,
  MessageFlags,
  type RepliableInteraction
} from "discord.js";

export type BaseMenuOptions<T> = {
  state: T;
  threshold?: number;
  ephemeral?: boolean;
};

export class BaseMenu<T> {
  state: T;
  private readonly threshold: number;
  private readonly ephemeral: boolean;

  private page: BaseMenuPage<T>;
  private history: BaseMenuPage<T>[] = [];

  private interaction: InteractionResponse;
  private message: Message;
  private collector: InteractionCollector<CollectedInteraction>;

  constructor({
    state,
    threshold = 60 * 1000 * 5,
    ephemeral = false
  }: BaseMenuOptions<T>) {
    this.state = state;
    this.threshold = threshold;
    this.ephemeral = ephemeral;

    if (this.threshold > 10 * 60 * 1000) {
      this.threshold = 10 * 60 * 1000;
    }
  }

  setPage(page: BaseMenuPage<T>) {
    if (this.page) {
      this.history.push(this.page);
    }

    page.setMenu(this);
    this.page = page;

    return this;
  }

  back() {
    const lastPage = this.history.pop();

    if (!lastPage) {
      throw new MenuException("There is no page to go back to.");
    }

    this.page = lastPage;

    return this;
  }

  private setupInteractionCollector() {
    this.collector = new InteractionCollector(this.message.client, {
      message: this.message,
      idle: this.threshold
    });

    this.collector.on("collect", async interaction => {
      try {
        if (interaction.isButton()) {
          if (!this.page.handleButton) {
            throw new MenuException(
              "Button interaction is not supported in this menu page."
            );
          }

          await this.page.handleButton(interaction);
        } else if (interaction.isStringSelectMenu()) {
          if (!this.page.handleStringSelectMenu) {
            throw new MenuException(
              "String select menu interaction is not supported in this menu page."
            );
          }

          await this.page.handleStringSelectMenu(interaction);
        } else if (interaction.isChannelSelectMenu()) {
          if (!this.page.handleChannelSelectMenu) {
            throw new MenuException(
              "Channel select menu interaction is not supported in this menu page."
            );
          }

          await this.page.handleChannelSelectMenu(interaction);
        } else if (interaction.isRoleSelectMenu()) {
          if (!this.page.handleRoleSelectMenu) {
            throw new MenuException(
              "Role select menu interaction is not supported in this menu page."
            );
          }

          await this.page.handleRoleSelectMenu(interaction);
        } else if (interaction.isMentionableSelectMenu()) {
          if (!this.page.handleMentionableSelectMenu) {
            throw new MenuException(
              "Mentionable select menu interaction is not supported in this menu page."
            );
          }

          await this.page.handleMentionableSelectMenu(interaction);
        } else if (interaction.isUserSelectMenu()) {
          if (!this.page.handleUserSelectMenu) {
            throw new MenuException(
              "User select menu interaction is not supported in this menu page."
            );
          }

          await this.page.handleUserSelectMenu(interaction);
        } else if (interaction.isModalSubmit() && interaction.isFromMessage()) {
          if (!this.page.handleModal) {
            throw new MenuException(
              "Modal submit interaction is not supported in this menu page."
            );
          }

          await this.page.handleModal(interaction);
        }
      } catch {
        container.logger.error("Failed to execute menu interaction");
      }

      this.message = await interaction.fetchReply();
    });

    this.collector.on("end", () => {
      this.handleEnd();
    });
  }

  private handleEnd() {
    const updatedComponents = this.message.components.map(row =>
      ActionRowBuilder.from<MessageActionRowComponentBuilder>(row)
    );

    for (const row of updatedComponents) {
      for (const component of row.components) {
        component.setDisabled(true);
      }
    }

    if (Date.now() - this.interaction.createdTimestamp < 15 * 60 * 1000) {
      return this.interaction.edit({ components: updatedComponents });
    }
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async render() {
    if (!this.page) {
      throw new MenuException("No page is set for the menu.");
    }

    return this.page.render();
  }

  async start(interaction: RepliableInteraction) {
    const sendData = await this.render();

    this.interaction = await interaction.reply({
      ...sendData,
      flags: this.ephemeral ? [MessageFlags.Ephemeral] : []
    });
    this.message = await this.interaction.fetch();

    this.setupInteractionCollector();
  }

  stop() {
    this.collector.stop();
  }
}
