/**
 * TestGovernanceRuntimeAdapter — S6-02.
 *
 * Implementação determinística mínima para o provider "test".
 * Reutiliza MockGovernanceRuntimeAdapter com provider forçado para "test".
 */
import {
  DEFAULT_MOCK_GOVERNANCE_RUNTIME_VERSION,
  MockGovernanceRuntimeAdapter,
  type MockGovernanceRuntimeAdapterOptions,
} from "./mock-governance-runtime-adapter";
import type { GovernanceRuntimePort } from "../ports/governance-runtime-port";
import type { GovernanceRuntimeCapabilities, GovernanceRuntimeInfo } from "../ports/types";
import type { GovernanceRuntimeProviderMetadata } from "../ports/types";

export const TEST_GOVERNANCE_RUNTIME_ADAPTER_ID = "test-governance-runtime";
export const TEST_GOVERNANCE_RUNTIME_VERSION = DEFAULT_MOCK_GOVERNANCE_RUNTIME_VERSION;

function testMetadata(): GovernanceRuntimeProviderMetadata {
  return {
    name: "Test Governance Runtime",
    version: TEST_GOVERNANCE_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Governance Runtime test adapter — no network, no real governance.",
  };
}

export type TestGovernanceRuntimeAdapterOptions = Omit<
  MockGovernanceRuntimeAdapterOptions,
  "provider"
>;

export class TestGovernanceRuntimeAdapter
  extends MockGovernanceRuntimeAdapter
  implements GovernanceRuntimePort
{
  constructor(options: TestGovernanceRuntimeAdapterOptions = {}) {
    super({ ...options, provider: "test" });
  }

  capabilities(): GovernanceRuntimeCapabilities {
    const caps = super.capabilities();
    return {
      ...caps,
      adapterId: TEST_GOVERNANCE_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): GovernanceRuntimeInfo {
    const info = super.providerInfo();
    return {
      ...info,
      metadata: testMetadata(),
    };
  }
}
