import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import {
  BaseContextMenuCommand,
  type BaseContextMenuCommandTypeMap
} from "@/framework/command/BaseContextMenuCommand";
import { BaseSlashCommand } from "@/framework/command/BaseSlashCommand";
import type {
  BaseComponent,
  BaseComponentTypeMap
} from "@/framework/component/BaseComponent";
import { BaseEvent } from "@/framework/event/BaseEvent";
import {
  BaseTrigger,
  type BaseTriggerTypeMap
} from "@/framework/trigger/BaseTrigger";
import { Config } from "@/framework/utility/Config";
import { Logger } from "@/framework/utility/Logger";
import { Client, type ClientOptions } from "discord.js";

export class Container {
  readonly client: Client;

  readonly settings: Config;
  readonly messages: Config;

  readonly logger: Logger;

  slashCommands: BaseSlashCommand[] = [];
  contextMenuCommands: BaseContextMenuCommand<
    keyof BaseContextMenuCommandTypeMap
  >[] = [];
  triggers: BaseTrigger<keyof BaseTriggerTypeMap>[] = [];
  components: BaseComponent<keyof BaseComponentTypeMap>[] = [];

  constructor(options: ClientOptions) {
    this.client = new Client(options);

    this.settings = new Config("config/settings.json", {
      token: "your-token-here",
      commands: {
        enabled: true,
        global: true,
        guild_id: null
      },
      colors: {
        primary: "#5865f2",
        error: "#ed4245",
        success: "#57f287"
      }
    });
    this.messages = new Config("config/messages.json", {});

    this.logger = new Logger();

    this.start();
  }

  private async loadFiles(...directories: string[]) {
    const files: any[] = [];

    for (const directory of directories) {
      try {
        const entries = await readdir(directory, {
          recursive: true
        });

        for (const entry of entries) {
          const entryPath = join(directory, entry);

          if (extname(entryPath) === ".ts") {
            const module = await import(entryPath);

            for (const value of Object.values(module)) {
              if (
                typeof value === "function" &&
                value.prototype &&
                value.prototype.constructor
              ) {
                //@ts-ignore
                const instance = new value();
                files.push(instance);
              }
            }
          }
        }
      } catch (error) {
        //@ts-ignore
        if (error.code === "ENOENT") {
          continue;
        }

        throw error;
      }
    }

    return files;
  }

  private async loadEvents() {
    const events = await this.loadFiles(
      "src/events",
      "src/framework/event/implementation"
    );
    const baseEvents = events.filter(event => event instanceof BaseEvent);

    for (const event of baseEvents) {
      this.client[event.once ? "once" : "on"](
        event.event,
        event.execute.bind(event)
      );
    }

    this.logger.info(`Loaded ${baseEvents.length} events`);
  }

  private async loadCommands() {
    const commands = await this.loadFiles("src/commands");
    const baseSlashCommands = commands.filter(
      command => command instanceof BaseSlashCommand
    );
    const BaseContextMenuCommands = commands.filter(
      command => command instanceof BaseContextMenuCommand
    );

    for (const command of baseSlashCommands) {
      this.slashCommands.push(command);
    }

    for (const command of BaseContextMenuCommands) {
      this.contextMenuCommands.push(command);
    }

    this.logger.info(
      `Loaded ${this.slashCommands.length + this.contextMenuCommands.length} commands (${this.slashCommands.length} slash, ${this.contextMenuCommands.length} context menu)`
    );
  }

  private async loadTriggers() {
    const triggers = await this.loadFiles("src/triggers");
    const baseTriggers = triggers.filter(
      trigger => trigger instanceof BaseTrigger
    );

    for (const trigger of baseTriggers) {
      this.triggers.push(trigger);
    }

    this.logger.info(`Loaded ${this.triggers.length} triggers`);
  }

  private async start() {
    await this.loadEvents();
    await this.loadTriggers();
    await this.loadCommands();

    await this.client.login(this.settings.getString("token"));
  }
}
