/**
 * Factory pública do TISSRuntimePort (TISS-01).
 */
import { createTISSRuntimeFactory } from "../factory/tiss-runtime-factory";
import type { TISSRuntimePort } from "../ports/tiss-runtime-port";
import type { TISSRuntimeProviderOptions } from "../ports/types";

export function createTISSRuntimePort(options: TISSRuntimeProviderOptions = {}): TISSRuntimePort {
  return createTISSRuntimeFactory({
    enterpriseDeps: options.enterpriseDeps,
  }).create(options);
}
