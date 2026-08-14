/**
 * TestComplianceRuntimeAdapter — S3-02.
 *
 * Implementação determinística mínima para o provider "test".
 * Reutiliza MockComplianceRuntimeAdapter com provider forçado para "test".
 */
import {
  DEFAULT_MOCK_COMPLIANCE_RUNTIME_VERSION,
  MockComplianceRuntimeAdapter,
  type MockComplianceRuntimeAdapterOptions,
} from "./mock-compliance-runtime-adapter";
import type { ComplianceRuntimePort } from "../ports/compliance-runtime-port";
import type { ComplianceRuntimeCapabilities, ComplianceRuntimeInfo } from "../ports/types";
import type { ComplianceRuntimeProviderMetadata } from "../ports/types";

export const TEST_COMPLIANCE_RUNTIME_ADAPTER_ID = "test-compliance-runtime";
export const TEST_COMPLIANCE_RUNTIME_VERSION = DEFAULT_MOCK_COMPLIANCE_RUNTIME_VERSION;

function testMetadata(): ComplianceRuntimeProviderMetadata {
  return {
    name: "Test Compliance Runtime",
    version: TEST_COMPLIANCE_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Compliance Runtime test adapter — no network, no real compliance.",
  };
}

export type TestComplianceRuntimeAdapterOptions = Omit<
  MockComplianceRuntimeAdapterOptions,
  "provider"
>;

export class TestComplianceRuntimeAdapter
  extends MockComplianceRuntimeAdapter
  implements ComplianceRuntimePort
{
  constructor(options: TestComplianceRuntimeAdapterOptions = {}) {
    super({ ...options, provider: "test" });
  }

  capabilities(): ComplianceRuntimeCapabilities {
    const caps = super.capabilities();
    return {
      ...caps,
      adapterId: TEST_COMPLIANCE_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): ComplianceRuntimeInfo {
    const info = super.providerInfo();
    return {
      ...info,
      metadata: testMetadata(),
    };
  }
}
