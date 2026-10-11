import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { seedMap } from '../shared/seed.js';
import { validateMap } from '../shared/map-ops.js';
import type { MindMap } from '../shared/types.js';

export class MapStore {
  private readonly filePath: string;

  constructor(filePath = process.env.MAPROOM_DATA_PATH ?? path.resolve('data/maps.json')) {
    this.filePath = filePath;
  }

  private async readAll(): Promise<MindMap[]> {
    try {
      const content = await readFile(this.filePath, 'utf8');
      const maps = JSON.parse(content) as MindMap[];
      return maps.map(validateMap);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await this.writeAll([seedMap]);
      return [structuredClone(seedMap)];
    }
  }

  private async writeAll(maps: MindMap[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(maps, null, 2)}\n`, 'utf8');
    await rename(temporary, this.filePath);
  }

  async list(): Promise<MindMap[]> {
    return this.readAll();
  }

  async get(id: string): Promise<MindMap> {
    const map = (await this.readAll()).find(item => item.id === id);
    if (!map) throw new Error(`Map not found: ${id}`);
    return map;
  }

  async save(map: MindMap): Promise<MindMap> {
    const next = validateMap({ ...map, updatedAt: new Date().toISOString() });
    const maps = await this.readAll();
    const index = maps.findIndex(item => item.id === next.id);
    if (index >= 0) maps[index] = next;
    else maps.push(next);
    await this.writeAll(maps);
    return next;
  }

  async delete(id: string): Promise<void> {
    const maps = await this.readAll();
    const filtered = maps.filter(item => item.id !== id);
    if (filtered.length === maps.length) throw new Error(`Map not found: ${id}`);
    await this.writeAll(filtered);
  }
}
