/**
 * TestCompletedRuntimeAdapter — A10-02.
 *
 * Implementação determinística mínima para o provider "test".
 * Reutiliza MockCompletedRuntimeAdapter com provider forçado para "test".
 */
import {
  DEFAULT_MOCK_COMPLETED_RUNTIME_VERSION,
  MockCompletedRuntimeAdapter,
  type MockCompletedRuntimeAdapterOptions,
} from "./mock-completed-runtime-adapter";
import type { CompletedRuntimePort } from "../ports/completed-runtime-port";
import type { CompletedRuntimeCapabilities, CompletedRuntimeInfo } from "../ports/types";
import type { CompletedRuntimeProviderMetadata } from "../ports/types";

export const TEST_COMPLETED_RUNTIME_ADAPTER_ID = "test-completed-runtime";
export const TEST_COMPLETED_RUNTIME_VERSION = DEFAULT_MOCK_COMPLETED_RUNTIME_VERSION;

function testMetadata(): CompletedRuntimeProviderMetadata {
  return {
    name: "Test Completed Runtime",
    version: TEST_COMPLETED_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Completed Runtime test adapter — no network, no real completion.",
  };
}

export type TestCompletedRuntimeAdapterOptions = Omit<
  MockCompletedRuntimeAdapterOptions,
  "provider"
>;

export class TestCompletedRuntimeAdapter
  extends MockCompletedRuntimeAdapter
  implements CompletedRuntimePort
{
  constructor(options: TestCompletedRuntimeAdapterOptions = {}) {
    super({ ...options, provider: "test" });
  }

  capabilities(): CompletedRuntimeCapabilities {
    const caps = super.capabilities();
    return {
      ...caps,
      adapterId: TEST_COMPLETED_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): CompletedRuntimeInfo {
    const info = super.providerInfo();
    return {
      ...info,
      metadata: testMetadata(),
    };
  }
}
