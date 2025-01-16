import type { BaseContextMenuCommandTypeMap } from "@/framework/command/BaseContextMenuCommand";
import { BaseEvent } from "@/framework/event/BaseEvent";
import { container } from "@/index";
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type RESTPostAPIContextMenuApplicationCommandsJSONBody
} from "discord.js";

export class CoreClientReadyEvent extends BaseEvent<"ready"> {
  constructor() {
    super({
      event: "ready"
    });
  }

  async execute() {
    if (container.settings.getBoolean("commands.enabled")) {
      await this.registerCommands();
    } else {
      container.logger.warn("Commands are disabled");
    }

    process.on("unhandledRejection", error => container.logger.error(error));
    process.on("uncaughtException", error => container.logger.error(error));
    process.on("uncaughtExceptionMonitor", error =>
      container.logger.error(error)
    );
  }

  private async registerCommands() {
    const slashCommands = this.getSlashCommandRegistrationData();
    const contextMenuCommands = this.getContextMenuCommandRegistrationData();
    const commands = [...slashCommands, ...contextMenuCommands];

    try {
      if (container.settings.getBoolean("commands.global")) {
        if (!container.client.application) {
          return container.logger.warn(
            "Application is not available, no commands will be registered"
          );
        }

        await container.client.application.commands.set(commands);
      } else {
        const guild = container.client.guilds.cache.get(
          container.settings.getString("commands.guild_id")
        );

        if (!guild) {
          return container.logger.warn(
            "Guild is not available, no commands will be registered"
          );
        }

        await guild.commands.set(commands);
      }
    } catch (error) {
      container.logger.error("Failed to register commands");
      container.logger.error(error);
    } finally {
      container.logger.info(
        "Both slash and context menu commands are registered"
      );
    }
  }

  private getSlashCommandRegistrationData() {
    return container.slashCommands.map(command => {
      const data: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: command.name,
        description: command.description,
        type: ApplicationCommandType.ChatInput
      };

      if (command.guildPlusUser) {
        data.contexts = [
          InteractionContextType.Guild,
          InteractionContextType.PrivateChannel,
          InteractionContextType.BotDM
        ];
        data.integration_types = [
          ApplicationIntegrationType.GuildInstall,
          ApplicationIntegrationType.UserInstall
        ];
      } else {
        data.contexts = [InteractionContextType.Guild];
        data.integration_types = [ApplicationIntegrationType.GuildInstall];
      }

      if (command.options && command.options.length) {
        //@ts-ignore
        data.options = command.options;
      }

      if (command.permissions && command.permissions.length) {
        //@ts-ignore
        data.defaultMemberPermissions = command.permissions;
      }

      return data;
    });
  }

  private getContextMenuCommandRegistrationData() {
    return container.contextMenuCommands.map(command => {
      const commandTypeMap: Record<
        keyof BaseContextMenuCommandTypeMap,
        ApplicationCommandType
      > = {
        messageContextMenuCommand: ApplicationCommandType.Message,
        userContextMenuCommand: ApplicationCommandType.User
      };

      const data: RESTPostAPIContextMenuApplicationCommandsJSONBody = {
        name: command.name,
        //@ts-ignore
        type: commandTypeMap[command.type]
      };

      if (command.guildPlusUser) {
        data.contexts = [
          InteractionContextType.Guild,
          InteractionContextType.PrivateChannel,
          InteractionContextType.BotDM
        ];
        data.integration_types = [
          ApplicationIntegrationType.GuildInstall,
          ApplicationIntegrationType.UserInstall
        ];
      } else {
        data.contexts = [InteractionContextType.Guild];
        data.integration_types = [ApplicationIntegrationType.GuildInstall];
      }

      if (command.permissions && command.permissions.length) {
        //@ts-ignore
        data.defaultMemberPermissions = command.permissions;
      }

      return data;
    });
  }
}
