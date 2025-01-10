import * as fs from "node:fs";
import * as path from "node:path";

type NestedObject = {
  [key: string]: NestedObject | unknown;
};

export class Config {
  private readonly filePath: string;

  private data: NestedObject;

  constructor(filePath: string, defaults: Record<string, unknown> = {}) {
    this.filePath = filePath;
    this.data = {};

    this.ensureFileExists();
    this.loadData();

    this.registerDefaults(defaults);
  }

  private registerDefaults(defaults: Record<string, unknown>) {
    for (const [entry, defaultValue] of Object.entries(defaults)) {
      this.registerEntry(entry, defaultValue);
    }
  }

  registerEntry(entry: string, defaultValue: unknown = null) {
    const pathSegments = entry.split(".");
    const key = pathSegments.pop();
    let current = this.data;

    for (const segment of pathSegments) {
      if (!(segment in current)) {
        current[segment] = {} as NestedObject;
      }
      current = current[segment] as NestedObject;
    }

    if (key && (current[key] === undefined || current[key] === null)) {
      current[key] = defaultValue;
      this.saveData();
    }
  }

  getTypedEntry<T>(entry: string) {
    const value = this.getEntry(entry);

    if (
      value instanceof Object &&
      !Array.isArray(value) &&
      typeof value === typeof ({} as T)
    ) {
      return value as T;
    }

    if (typeof value === typeof (null as T)) {
      return value as T;
    }

    throw new Error(
      `Expected ${typeof value} at "${entry}" and not ${typeof (null as T)}`
    );
  }

  getString(entry: string) {
    const value = this.getEntry(entry);

    if (typeof value !== "string") {
      throw new Error(`Expected ${typeof value} at "${entry}" and not string`);
    }

    return value;
  }

  getBoolean(entry: string) {
    const value = this.getEntry(entry);

    if (typeof value !== "boolean") {
      throw new Error(`Expected ${typeof value} at "${entry}" and not boolean`);
    }

    return value;
  }

  getNumber(entry: string) {
    const value = this.getEntry(entry);

    if (typeof value !== "number") {
      throw new Error(`Expected ${typeof value} at "${entry}" and not number`);
    }

    return value;
  }

  getObject(entry: string) {
    const value = this.getEntry(entry);

    if (typeof value !== "object" || Array.isArray(value) || value === null) {
      throw new Error(`Expected ${typeof value} at "${entry}" and not object`);
    }

    return value;
  }

  getArray(entry: string) {
    const value = this.getEntry(entry);

    if (!Array.isArray(value)) {
      throw new Error(`Expected ${typeof value} at "${entry}" and not array`);
    }

    return value;
  }

  getNullOrUndefined(entry: string) {
    const value = this.getEntry(entry);

    if (value !== null && value !== undefined) {
      throw new Error(
        `Expected ${typeof value} at "${entry}" and not null or undefined`
      );
    }

    return value;
  }

  private ensureFileExists() {
    const dir = path.dirname(this.filePath);

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
    }
  }

  private loadData() {
    try {
      this.data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
    } catch {
      this.data = {};
    }
  }

  private saveData() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  private getEntry(entry: string) {
    return entry.split(".").reduce<unknown>((current, segment) => {
      if (
        typeof current === "object" &&
        current !== null &&
        segment in current
      ) {
        return (current as NestedObject)[segment];
      }

      throw new Error(`Entry "${entry}" not found`);
    }, this.data);
  }
}
