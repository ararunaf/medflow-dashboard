import { DefaultBusinessEngineAdapter } from "../adapters/default-business-engine-adapter";
import { MockBusinessEngineAdapter } from "../adapters/mock-business-engine-adapter";
import type { BusinessEnginePort } from "../ports/business-engine-port";
import type { BusinessEngineProviderId } from "../ports/types";

export interface CreateBusinessEnginePortInput {
  provider?: BusinessEngineProviderId;
  healthy?: boolean;
}

export function createBusinessEnginePort(
  input: CreateBusinessEnginePortInput = {},
): BusinessEnginePort {
  const provider = input.provider ?? "default";
  switch (provider) {
    case "mock":
      return new MockBusinessEngineAdapter({ healthy: input.healthy });
    case "default":
    case "enterprise":
    case "test":
    default:
      return new DefaultBusinessEngineAdapter({ healthy: input.healthy });
  }
}
