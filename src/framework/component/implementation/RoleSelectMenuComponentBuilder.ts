import { deleteComponent } from "@/framework/utility/Component";
import { container } from "@/index";
import {
  RoleSelectMenuBuilder,
  type RoleSelectMenuInteraction,
  SnowflakeUtil
} from "discord.js";

type RoleSelectMenuComponentBuilderExecuteOptions = {
  execute: (
    interaction: RoleSelectMenuInteraction,
    stop: () => void
  ) => unknown;
  expiredExecute?(id: string): unknown;
  allowedExecutorIds?: string[];
  executionThreshold?: number;
  renewOnInteract?: boolean;
};

export class RoleSelectMenuComponentBuilder extends RoleSelectMenuBuilder {
  setExecute({
    execute,
    expiredExecute,
    allowedExecutorIds = [],
    executionThreshold = 60 * 1000 * 5,
    renewOnInteract = false
  }: RoleSelectMenuComponentBuilderExecuteOptions) {
    const customId = SnowflakeUtil.generate().toString();

    this.setCustomId(customId);

    if (executionThreshold > 10 * 60 * 1000) {
      executionThreshold = 10 * 60 * 1000;
    }

    const timeout = setTimeout(() => {
      if (expiredExecute) {
        expiredExecute(customId);
      }

      deleteComponent(customId, "roleSelectMenu");
    }, executionThreshold);

    container.components.push({
      id: customId,
      type: "roleSelectMenu",
      allowedExecutorIds,
      executionThreshold,
      renewOnInteract,
      timeout,
      execute,
      expiredExecute
    });

    return this;
  }
}
