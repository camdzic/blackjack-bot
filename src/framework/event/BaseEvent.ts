import type { ClientEvents } from "discord.js";

type BaseEventOptions<K extends keyof ClientEvents> = {
  event: K;
  once?: boolean;
};

export abstract class BaseEvent<K extends keyof ClientEvents> {
  readonly event: K;
  readonly once: boolean;

  constructor({ event, once = false }: BaseEventOptions<K>) {
    this.event = event;
    this.once = once;
  }

  abstract execute(...args: ClientEvents[K]): unknown;
}
