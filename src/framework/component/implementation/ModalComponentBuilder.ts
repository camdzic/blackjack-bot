import { deleteComponent } from "@/framework/utility/Component";
import { container } from "@/index";
import {
  ModalBuilder,
  type ModalMessageModalSubmitInteraction,
  SnowflakeUtil
} from "discord.js";

type ModalComponentBuilderExecuteOptions = {
  execute: (interaction: ModalMessageModalSubmitInteraction) => unknown;
  executionThreshold?: number;
};

export class ModalComponentBuilder extends ModalBuilder {
  setExecute({
    execute,
    executionThreshold = 60 * 1000 * 5
  }: ModalComponentBuilderExecuteOptions) {
    const customId = SnowflakeUtil.generate().toString();

    this.setCustomId(customId);

    if (executionThreshold > 10 * 60 * 1000) {
      executionThreshold = 10 * 60 * 1000;
    }

    const timeout = setTimeout(() => {
      deleteComponent(customId, "modal");
    }, executionThreshold);

    container.components.push({
      id: customId,
      type: "modal",
      allowedExecutorIds: [],
      executionThreshold,
      renewOnInteract: false,
      timeout,
      execute
    });

    return this;
  }
}
