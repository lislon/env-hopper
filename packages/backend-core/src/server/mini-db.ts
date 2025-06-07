import { promises as fs } from 'fs';
import path from 'path';

export class MiniDB {
  private data: Record<string, unknown> = {};
  private initialized = false;

  /**
   * @param relativeFilePath  Path *relative* to your project root (process.cwd()), e.g. './cache/db.json'
   */
  constructor(private relativeFilePath: string) {}

  /** Load disk file once */
  private async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const fullPath = path.resolve(process.cwd(), this.relativeFilePath);
    try {
      const raw = await fs.readFile(fullPath, 'utf-8');
      this.data = JSON.parse(raw) as Record<string, unknown>;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.data = {};
      } else {
        throw err;
      }
    }
  }

  /** Write current state back to disk */
  private async save(): Promise<void> {
    const fullPath = path.resolve(process.cwd(), this.relativeFilePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  /**
   * Fetches a value and casts it to T.
   * @throws if missing
   */
  async get<T>(key: string): Promise<T> {
    await this.init();
    if (!(key in this.data)) {
      throw new Error(`Key not found: "${key}"`);
    }
    return this.data[key] as T;
  }

  /**
   * Stores any JSON-serializable value.
   */
  async set(key: string, value: unknown): Promise<void> {
    await this.init();
    this.data[key] = value;
    await this.save();
  }

  /**
   * Deletes a key; returns true if it was present.
   */
  async delete(key: string): Promise<boolean> {
    await this.init();
    if (key in this.data) {
      delete this.data[key];
      await this.save();
      return true;
    }
    return false;
  }

  /** Clears entire store */
  async clear(): Promise<void> {
    this.data = {};
    await this.save();
  }

  /** Lists all keys */
  async keys(): Promise<string[]> {
    await this.init();
    return Object.keys(this.data);
  }
}

export const miniDb = new MiniDB('./cache/db.json');
