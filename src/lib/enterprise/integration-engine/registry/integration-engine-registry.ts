/**
 * Registry do Bloco F — Enterprise Integration Engine.
 *
 * Registra Default e Mock providers. Sem fallback silencioso.
 */
import { DefaultIntegrationEngineAdapter } from "../adapters";
import { MockIntegrationEngineAdapter } from "../adapters";
import type { IntegrationEnginePort } from "../ports";

interface IntegrationEngineProviderEntry {
  readonly id: "default" | "mock";
  readonly create: () => IntegrationEnginePort;
}

const defaultEntry: IntegrationEngineProviderEntry = {
  id: "default",
  create: () => new DefaultIntegrationEngineAdapter(),
};

const mockEntry: IntegrationEngineProviderEntry = {
  id: "mock",
  create: () => new MockIntegrationEngineAdapter(),
};

class IntegrationEngineRegistry {
  private readonly providers = new Map<string, IntegrationEngineProviderEntry>();

  constructor() {
    this.providers.set(defaultEntry.id, defaultEntry);
    this.providers.set(mockEntry.id, mockEntry);
  }

  register(id: "default" | "mock", create: () => IntegrationEnginePort): void {
    this.providers.set(id, { id, create });
  }

  get(id: string): IntegrationEngineProviderEntry | undefined {
    return this.providers.get(id);
  }

  list(): readonly string[] {
    return Array.from(this.providers.keys());
  }
}

export const integrationEngineRegistry = new IntegrationEngineRegistry();
