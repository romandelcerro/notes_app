import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

export const CACHE_TTL = {
  LIST: 30_000,
  ITEM: 60_000,
};

@Injectable()
export class CacheService {
  private readonly keys = new Set<string>();

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    const val = await this.cache.get<T>(key);
    if (val === undefined) this.keys.delete(key);
    return val;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (this.keys.size > 10_000) this.keys.clear();
    this.keys.add(key);
    await this.cache.set(key, value, ttl ?? CACHE_TTL.ITEM);
  }

  async del(key: string): Promise<void> {
    this.keys.delete(key);
    await this.cache.del(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    const found: string[] = [];
    for (const key of this.keys) {
      if (key.startsWith(prefix)) found.push(key);
    }
    for (const key of found) {
      this.keys.delete(key);
      await this.cache.del(key);
    }
  }
}
