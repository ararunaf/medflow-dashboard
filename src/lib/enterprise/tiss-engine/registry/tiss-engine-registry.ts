import { DefaultTissEngineAdapter, MockTissEngineAdapter } from "../adapters";
import type { TissEnginePort } from "../ports";

export type TissEngineProvider = "default" | "mock";

export class TissEngineRegistry {
  private readonly adapters = new Map<TissEngineProvider, new () => TissEnginePort>();

  constructor() {
    this.adapters.set("default", DefaultTissEngineAdapter);
    this.adapters.set("mock", MockTissEngineAdapter);
  }

  resolve(provider: TissEngineProvider): TissEnginePort {
    const Adapter = this.adapters.get(provider);
    if (!Adapter) {
      throw new Error(`TissEngine provider "${provider}" not found`);
    }
    return new Adapter();
  }

  has(provider: TissEngineProvider): boolean {
    return this.adapters.has(provider);
  }
}

export const tissEngineRegistry = new TissEngineRegistry();
