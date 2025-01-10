import { deleteComponent } from "@/framework/utility/Component";
import { container } from "@/index";
import {
  SnowflakeUtil,
  StringSelectMenuBuilder,
  type StringSelectMenuInteraction
} from "discord.js";

type StringSelectMenuComponentBuilderExecuteOptions = {
  execute: (
    interaction: StringSelectMenuInteraction,
    stop: () => void
  ) => unknown;
  expiredExecute?(id: string): unknown;
  allowedExecutorIds?: string[];
  executionThreshold?: number;
  renewOnInteract?: boolean;
};

export class StringSelectMenuComponentBuilder extends StringSelectMenuBuilder {
  setExecute({
    execute,
    expiredExecute,
    allowedExecutorIds = [],
    executionThreshold = 60 * 1000 * 5,
    renewOnInteract = false
  }: StringSelectMenuComponentBuilderExecuteOptions) {
    const customId = SnowflakeUtil.generate().toString();

    this.setCustomId(customId);

    if (executionThreshold > 10 * 60 * 1000) {
      executionThreshold = 10 * 60 * 1000;
    }

    const timeout = setTimeout(() => {
      if (expiredExecute) {
        expiredExecute(customId);
      }

      deleteComponent(customId, "stringSelectMenu");
    }, executionThreshold);

    container.components.push({
      id: customId,
      type: "stringSelectMenu",
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
