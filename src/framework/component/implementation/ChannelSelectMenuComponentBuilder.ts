import { deleteComponent } from "@/framework/utility/Component";
import { container } from "@/index";
import {
  ChannelSelectMenuBuilder,
  type ChannelSelectMenuInteraction,
  SnowflakeUtil
} from "discord.js";

type ChannelSelectMenuComponentBuilderExecuteOptions = {
  execute: (
    interaction: ChannelSelectMenuInteraction,
    stop: () => void
  ) => unknown;
  expiredExecute?(id: string): unknown;
  allowedExecutorIds?: string[];
  executionThreshold?: number;
  renewOnInteract?: boolean;
};

export class ChannelSelectMenuComponentBuilder extends ChannelSelectMenuBuilder {
  setExecute({
    execute,
    expiredExecute,
    allowedExecutorIds = [],
    executionThreshold = 60 * 1000 * 5,
    renewOnInteract = false
  }: ChannelSelectMenuComponentBuilderExecuteOptions) {
    const customId = SnowflakeUtil.generate().toString();

    this.setCustomId(customId);

    if (executionThreshold > 10 * 60 * 1000) {
      executionThreshold = 10 * 60 * 1000;
    }

    const timeout = setTimeout(() => {
      if (expiredExecute) {
        expiredExecute(customId);
      }

      deleteComponent(customId, "channelSelectMenu");
    }, executionThreshold);

    container.components.push({
      id: customId,
      type: "channelSelectMenu",
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
