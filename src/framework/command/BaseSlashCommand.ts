import type { BaseGuard, BaseGuardTypeMap } from "@/framework/guard/BaseGuard";
import type {
  ApplicationCommandOptionData,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  PermissionResolvable
} from "discord.js";

type BaseSlashCommandOptions = {
  name: string;
  description: string;
  category: string;
  guildPlusUser: boolean;
  options?: ApplicationCommandOptionData[];
  guards?: BaseGuard<keyof BaseGuardTypeMap>[];
  permissions?: PermissionResolvable[];
};

export abstract class BaseSlashCommand {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly guildPlusUser: boolean;
  readonly options?: ApplicationCommandOptionData[] = [];
  readonly guards?: BaseGuard<keyof BaseGuardTypeMap>[] = [];
  readonly permissions?: PermissionResolvable[] = [];

  constructor({
    name,
    description,
    category,
    options,
    guards,
    permissions,
    guildPlusUser
  }: BaseSlashCommandOptions) {
    this.name = name;
    this.description = description;
    this.category = category;
    this.options = options;
    this.guards = guards;
    this.permissions = permissions;
    this.guildPlusUser = guildPlusUser;
  }

  abstract execute(interaction: ChatInputCommandInteraction): unknown;
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  // biome-ignore lint/correctness/noUnusedFunctionParameters: <explanation>
  autocompleteExecute?(interaction: AutocompleteInteraction): unknown {
    return null;
  }
}
