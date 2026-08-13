/**
 * TestAuthorizationRuntimeAdapter — S3-02.
 *
 * Implementação determinística mínima para o provider "test".
 * Reutiliza MockAuthorizationRuntimeAdapter com provider forçado para "test".
 */
import {
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION,
  MockAuthorizationRuntimeAdapter,
  type MockAuthorizationRuntimeAdapterOptions,
} from "./mock-authorization-runtime-adapter";
import type { AuthorizationRuntimePort } from "../ports/authorization-runtime-port";
import type { AuthorizationRuntimeCapabilities, AuthorizationRuntimeInfo } from "../ports/types";
import type { AuthorizationRuntimeProviderMetadata } from "../ports/types";

export const TEST_AUTHORIZATION_RUNTIME_ADAPTER_ID = "test-authorization-runtime";
export const TEST_AUTHORIZATION_RUNTIME_VERSION = DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION;

function testMetadata(): AuthorizationRuntimeProviderMetadata {
  return {
    name: "Test Authorization Runtime",
    version: TEST_AUTHORIZATION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Authorization Runtime test adapter — no network, no real authorization.",
  };
}

export type TestAuthorizationRuntimeAdapterOptions = Omit<
  MockAuthorizationRuntimeAdapterOptions,
  "provider"
>;

export class TestAuthorizationRuntimeAdapter
  extends MockAuthorizationRuntimeAdapter
  implements AuthorizationRuntimePort
{
  constructor(options: TestAuthorizationRuntimeAdapterOptions = {}) {
    super({ ...options, provider: "test" });
  }

  capabilities(): AuthorizationRuntimeCapabilities {
    const caps = super.capabilities();
    return {
      ...caps,
      adapterId: TEST_AUTHORIZATION_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): AuthorizationRuntimeInfo {
    const info = super.providerInfo();
    return {
      ...info,
      metadata: testMetadata(),
    };
  }
}
