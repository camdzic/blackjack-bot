import { BaseEvent } from "@/framework";
import { container } from "@/index";

export class ClientReadyEvent extends BaseEvent<"ready"> {
  constructor() {
    super({
      event: "ready"
    });
  }

  execute() {
    container.logger.info("Bot is ready!");
  }
}
