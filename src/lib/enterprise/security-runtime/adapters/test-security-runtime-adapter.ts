/**
 * TestSecurityRuntimeAdapter — S1-02.
 *
 * Implementação determinística mínima para o provider "test".
 * Reutiliza MockSecurityRuntimeAdapter com provider forçado para "test".
 */
import {
  DEFAULT_MOCK_SECURITY_RUNTIME_VERSION,
  MockSecurityRuntimeAdapter,
  type MockSecurityRuntimeAdapterOptions,
} from "./mock-security-runtime-adapter";
import type { SecurityRuntimePort } from "../ports/security-runtime-port";
import type { SecurityRuntimeCapabilities, SecurityRuntimeInfo } from "../ports/types";
import type { SecurityRuntimeProviderMetadata } from "../ports/types";

export const TEST_SECURITY_RUNTIME_ADAPTER_ID = "test-security-runtime";
export const TEST_SECURITY_RUNTIME_VERSION = DEFAULT_MOCK_SECURITY_RUNTIME_VERSION;

function testMetadata(): SecurityRuntimeProviderMetadata {
  return {
    name: "Test Security Runtime",
    version: TEST_SECURITY_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Security Runtime test adapter — no network, no real security.",
  };
}

export type TestSecurityRuntimeAdapterOptions = Omit<MockSecurityRuntimeAdapterOptions, "provider">;

export class TestSecurityRuntimeAdapter
  extends MockSecurityRuntimeAdapter
  implements SecurityRuntimePort
{
  constructor(options: TestSecurityRuntimeAdapterOptions = {}) {
    super({ ...options, provider: "test" });
  }

  capabilities(): SecurityRuntimeCapabilities {
    const caps = super.capabilities();
    return {
      ...caps,
      adapterId: TEST_SECURITY_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): SecurityRuntimeInfo {
    const info = super.providerInfo();
    return {
      ...info,
      metadata: testMetadata(),
    };
  }
}
