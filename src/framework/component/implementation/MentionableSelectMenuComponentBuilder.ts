import { deleteComponent } from "@/framework/utility/Component";
import { container } from "@/index";
import {
  MentionableSelectMenuBuilder,
  type MentionableSelectMenuInteraction,
  SnowflakeUtil
} from "discord.js";

type MentionableSelectMenuComponentBuilderExecuteOptions = {
  execute: (
    interaction: MentionableSelectMenuInteraction,
    stop: () => void
  ) => unknown;
  expiredExecute?(id: string): unknown;
  allowedExecutorIds?: string[];
  executionThreshold?: number;
  renewOnInteract?: boolean;
};

export class MentionableSelectMenuComponentBuilder extends MentionableSelectMenuBuilder {
  setExecute({
    execute,
    expiredExecute,
    allowedExecutorIds = [],
    executionThreshold = 60 * 1000 * 5,
    renewOnInteract = false
  }: MentionableSelectMenuComponentBuilderExecuteOptions) {
    const customId = SnowflakeUtil.generate().toString();

    this.setCustomId(customId);

    if (executionThreshold > 10 * 60 * 1000) {
      executionThreshold = 10 * 60 * 1000;
    }

    const timeout = setTimeout(() => {
      if (expiredExecute) {
        expiredExecute(customId);
      }

      deleteComponent(customId, "mentionableSelectMenu");
    }, executionThreshold);

    container.components.push({
      id: customId,
      type: "mentionableSelectMenu",
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
