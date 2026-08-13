/**
 * TestIdentityRuntimeAdapter — S2-02.
 *
 * Implementação determinística mínima para o provider "test".
 * Reutiliza MockIdentityRuntimeAdapter com provider forçado para "test".
 */
import {
  DEFAULT_MOCK_IDENTITY_RUNTIME_VERSION,
  MockIdentityRuntimeAdapter,
  type MockIdentityRuntimeAdapterOptions,
} from "./mock-identity-runtime-adapter";
import type { IdentityRuntimePort } from "../ports/identity-runtime-port";
import type { IdentityRuntimeCapabilities, IdentityRuntimeInfo } from "../ports/types";
import type { IdentityRuntimeProviderMetadata } from "../ports/types";

export const TEST_IDENTITY_RUNTIME_ADAPTER_ID = "test-identity-runtime";
export const TEST_IDENTITY_RUNTIME_VERSION = DEFAULT_MOCK_IDENTITY_RUNTIME_VERSION;

function testMetadata(): IdentityRuntimeProviderMetadata {
  return {
    name: "Test Identity Runtime",
    version: TEST_IDENTITY_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Identity Runtime test adapter — no network, no real identity.",
  };
}

export type TestIdentityRuntimeAdapterOptions = Omit<MockIdentityRuntimeAdapterOptions, "provider">;

export class TestIdentityRuntimeAdapter
  extends MockIdentityRuntimeAdapter
  implements IdentityRuntimePort
{
  constructor(options: TestIdentityRuntimeAdapterOptions = {}) {
    super({ ...options, provider: "test" });
  }

  capabilities(): IdentityRuntimeCapabilities {
    const caps = super.capabilities();
    return {
      ...caps,
      adapterId: TEST_IDENTITY_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): IdentityRuntimeInfo {
    const info = super.providerInfo();
    return {
      ...info,
      metadata: testMetadata(),
    };
  }
}
