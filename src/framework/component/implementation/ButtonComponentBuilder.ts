import { deleteComponent } from "@/framework/utility/Component";
import { container } from "@/index";
import {
  ButtonBuilder,
  type ButtonInteraction,
  SnowflakeUtil
} from "discord.js";

type ButtonComponentBuilderExecuteOptions = {
  execute: (interaction: ButtonInteraction, stop: () => void) => unknown;
  expiredExecute?(id: string): unknown;
  allowedExecutorIds?: string[];
  executionThreshold?: number;
  renewOnInteract?: boolean;
};

export class ButtonComponentBuilder extends ButtonBuilder {
  setExecute({
    execute,
    expiredExecute,
    allowedExecutorIds = [],
    executionThreshold = 60 * 1000 * 5,
    renewOnInteract = false
  }: ButtonComponentBuilderExecuteOptions) {
    const customId = SnowflakeUtil.generate().toString();

    this.setCustomId(customId);

    if (executionThreshold > 10 * 60 * 1000) {
      executionThreshold = 10 * 60 * 1000;
    }

    const timeout = setTimeout(() => {
      if (expiredExecute) {
        expiredExecute(customId);
      }

      deleteComponent(customId, "button");
    }, executionThreshold);

    container.components.push({
      id: customId,
      type: "button",
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
