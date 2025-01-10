import { container } from "@/index";
import { type ColorResolvable, EmbedBuilder } from "discord.js";

export class DefaultEmbed extends EmbedBuilder {
  constructor() {
    super();

    this.setColor(
      container.settings.getString("colors.primary") as ColorResolvable
    );
  }
}
