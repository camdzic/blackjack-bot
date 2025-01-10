import type { BaseGuard, BaseGuardTypeMap } from "@/framework/guard/BaseGuard";
import type {
  MessageContextMenuCommandInteraction,
  PermissionResolvable,
  UserContextMenuCommandInteraction
} from "discord.js";

export type BaseContextMenuCommandTypeMap = {
  messageContextMenuCommand: MessageContextMenuCommandInteraction;
  userContextMenuCommand: UserContextMenuCommandInteraction;
};

type BaseContextMenuCommandOptions<
  T extends keyof BaseContextMenuCommandTypeMap
> = {
  name: string;
  type: T;
  guildPlusUser: boolean;
  guards?: BaseGuard<keyof BaseGuardTypeMap>[];
  permissions?: PermissionResolvable[];
};

export abstract class BaseContextMenuCommand<
  T extends keyof BaseContextMenuCommandTypeMap
> {
  readonly name: string;
  readonly type: T;
  guildPlusUser: boolean;
  readonly guards?: BaseGuard<keyof BaseGuardTypeMap>[] = [];
  readonly permissions?: PermissionResolvable[] = [];

  constructor({
    name,
    type,
    guildPlusUser,
    guards,
    permissions
  }: BaseContextMenuCommandOptions<T>) {
    this.name = name;
    this.type = type;
    this.guildPlusUser = guildPlusUser;
    this.guards = guards;
    this.permissions = permissions;
  }

  abstract execute(interaction: BaseContextMenuCommandTypeMap[T]): unknown;
}
