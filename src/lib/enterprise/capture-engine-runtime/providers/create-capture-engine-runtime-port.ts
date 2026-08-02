/**
 * CaptureEngineRuntimeProvider — factory do Port (DIP-02).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters concretos no Domain.
 *
 * Default: DefaultCaptureEngineRuntimeAdapter (exige enterpriseDeps).
 */
import { createCaptureEngineRuntimeFactory } from "../factory/capture-engine-runtime-factory";
import type { CaptureEngineRuntimePort } from "../ports/capture-engine-runtime-port";
import type { CaptureEngineRuntimeProviderOptions } from "../ports/types";

/**
 * Cria o CaptureEngineRuntimePort para o provedor solicitado.
 *
 * Default de produção: DefaultCaptureEngineRuntimeAdapter
 * (Orchestrator + DocumentIntakeRuntime via enterpriseDeps).
 */
export function createCaptureEngineRuntimePort(
  options: CaptureEngineRuntimeProviderOptions = {},
): CaptureEngineRuntimePort {
  return createCaptureEngineRuntimeFactory({
    enterpriseDeps: options.enterpriseDeps,
  }).create(options);
}
