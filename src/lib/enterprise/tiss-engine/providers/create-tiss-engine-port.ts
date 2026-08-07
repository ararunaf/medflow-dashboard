import { tissEngineRegistry, type TissEngineProvider } from "../registry";
import type { TissEnginePort } from "../ports";

export function createTissEnginePort(provider: TissEngineProvider = "default"): TissEnginePort {
  return tissEngineRegistry.resolve(provider);
}
