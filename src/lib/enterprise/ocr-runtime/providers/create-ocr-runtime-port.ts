/**
 * OCRRuntimeProvider — factory do Port (DIP-03).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters concretos no Domain.
 *
 * Default: DefaultOCRRuntimeAdapter (exige enterpriseDeps).
 */
import { createOCRRuntimeFactory } from "../factory/ocr-runtime-factory";
import type { OCRRuntimePort } from "../ports/ocr-runtime-port";
import type { OCRRuntimeProviderOptions } from "../ports/types";

/**
 * Cria o OCRRuntimePort para o provedor solicitado.
 *
 * Default de produção: DefaultOCRRuntimeAdapter
 * (Orchestrator + OCR Provider Adapter estrutural via enterpriseDeps).
 */
export function createOCRRuntimePort(options: OCRRuntimeProviderOptions = {}): OCRRuntimePort {
  return createOCRRuntimeFactory({
    enterpriseDeps: options.enterpriseDeps,
  }).create(options);
}
