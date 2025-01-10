import { deleteComponent } from "@/framework/utility/Component";
import { container } from "@/index";
import {
  SnowflakeUtil,
  UserSelectMenuBuilder,
  type UserSelectMenuInteraction
} from "discord.js";

type UserSelectMenuComponentBuilderExecuteOptions = {
  execute: (
    interaction: UserSelectMenuInteraction,
    stop: () => void
  ) => unknown;
  expiredExecute?(id: string): unknown;
  allowedExecutorIds?: string[];
  executionThreshold?: number;
  renewOnInteract?: boolean;
};

export class UserSelectMenuComponentBuilder extends UserSelectMenuBuilder {
  setExecute({
    execute,
    expiredExecute,
    allowedExecutorIds = [],
    executionThreshold = 60 * 1000 * 5,
    renewOnInteract = false
  }: UserSelectMenuComponentBuilderExecuteOptions) {
    const customId = SnowflakeUtil.generate().toString();

    this.setCustomId(customId);

    if (executionThreshold > 10 * 60 * 1000) {
      executionThreshold = 10 * 60 * 1000;
    }

    const timeout = setTimeout(() => {
      if (expiredExecute) {
        expiredExecute(customId);
      }

      deleteComponent(customId, "userSelectMenu");
    }, executionThreshold);

    container.components.push({
      id: customId,
      type: "userSelectMenu",
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
