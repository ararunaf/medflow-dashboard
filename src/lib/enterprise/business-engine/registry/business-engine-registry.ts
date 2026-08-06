import { DefaultBusinessEngineAdapter } from "../adapters/default-business-engine-adapter";
import { MockBusinessEngineAdapter } from "../adapters/mock-business-engine-adapter";
import type { BusinessEnginePort } from "../ports/business-engine-port";
import type { BusinessEngineProviderId } from "../ports/types";

export class BusinessEngineRegistry {
  private readonly adapters = new Map<BusinessEngineProviderId, () => BusinessEnginePort>();

  constructor() {
    this.adapters.set("default", () => new DefaultBusinessEngineAdapter());
    this.adapters.set("enterprise", () => new DefaultBusinessEngineAdapter());
    this.adapters.set("mock", () => new MockBusinessEngineAdapter());
    this.adapters.set("test", () => new DefaultBusinessEngineAdapter());
  }

  register(provider: BusinessEngineProviderId, factory: () => BusinessEnginePort): void {
    this.adapters.set(provider, factory);
  }

  resolve(provider: BusinessEngineProviderId): BusinessEnginePort {
    const factory = this.adapters.get(provider);
    if (!factory) {
      throw new Error(`BusinessEngine provider not registered: ${provider}`);
    }
    return factory();
  }

  has(provider: BusinessEngineProviderId): boolean {
    return this.adapters.has(provider);
  }
}

export const businessEngineRegistry = new BusinessEngineRegistry();
