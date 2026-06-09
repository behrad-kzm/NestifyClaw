import { Injectable } from '@nestjs/common';
import type { StateStorePort } from '../../common/types';

/**
 * In-memory implementation of {@link StateStorePort} (bucket J).
 *
 * Good enough to make the pipeline runnable end-to-end. Swap for a persistent
 * backend (the openclaw `plugin-state-runtime` / `json-store`) behind the same
 * port when needed — no caller changes.
 */
@Injectable()
export class StateStoreService implements StateStorePort {
  private readonly store = new Map<string, unknown>();

  private compositeKey(namespace: string, key: string): string {
    return `${namespace}\u0000${key}`;
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    return (this.store.get(this.compositeKey(namespace, key)) as T) ?? null;
  }

  async set<T>(namespace: string, key: string, value: T): Promise<void> {
    this.store.set(this.compositeKey(namespace, key), value);
  }

  async delete(namespace: string, key: string): Promise<void> {
    this.store.delete(this.compositeKey(namespace, key));
  }
}
