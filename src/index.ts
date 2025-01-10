import { Container } from "@/framework";
import { Partials } from "discord.js";

export const container = new Container({
  intents: [],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction
  ]
});
