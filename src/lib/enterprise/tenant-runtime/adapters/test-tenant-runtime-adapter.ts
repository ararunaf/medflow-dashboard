/**
 * TestTenantRuntimeAdapter — S3-02.
 *
 * Implementação determinística mínima para o provider "test".
 * Reutiliza MockTenantRuntimeAdapter com provider forçado para "test".
 */
import {
  DEFAULT_MOCK_TENANT_RUNTIME_VERSION,
  MockTenantRuntimeAdapter,
  type MockTenantRuntimeAdapterOptions,
} from "./mock-tenant-runtime-adapter";
import type { TenantRuntimePort } from "../ports/tenant-runtime-port";
import type { TenantRuntimeCapabilities, TenantRuntimeInfo } from "../ports/types";
import type { TenantRuntimeProviderMetadata } from "../ports/types";

export const TEST_TENANT_RUNTIME_ADAPTER_ID = "test-tenant-runtime";
export const TEST_TENANT_RUNTIME_VERSION = DEFAULT_MOCK_TENANT_RUNTIME_VERSION;

function testMetadata(): TenantRuntimeProviderMetadata {
  return {
    name: "Test Tenant Runtime",
    version: TEST_TENANT_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Tenant Runtime test adapter — no network, no real tenant.",
  };
}

export type TestTenantRuntimeAdapterOptions = Omit<MockTenantRuntimeAdapterOptions, "provider">;

export class TestTenantRuntimeAdapter
  extends MockTenantRuntimeAdapter
  implements TenantRuntimePort
{
  constructor(options: TestTenantRuntimeAdapterOptions = {}) {
    super({ ...options, provider: "test" });
  }

  capabilities(): TenantRuntimeCapabilities {
    const caps = super.capabilities();
    return {
      ...caps,
      adapterId: TEST_TENANT_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): TenantRuntimeInfo {
    const info = super.providerInfo();
    return {
      ...info,
      metadata: testMetadata(),
    };
  }
}
