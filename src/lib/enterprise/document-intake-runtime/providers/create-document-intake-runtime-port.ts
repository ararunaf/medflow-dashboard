/**
 * DocumentIntakeRuntimeProvider — factory do Port (DIP-01).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters concretos no Domain.
 *
 * Default: DefaultDocumentIntakeRuntimeAdapter (exige enterpriseDeps).
 */
import { createDocumentIntakeRuntimeFactory } from "../factory/document-intake-runtime-factory";
import type { DocumentIntakeRuntimePort } from "../ports/document-intake-runtime-port";
import type { DocumentIntakeRuntimeProviderOptions } from "../ports/types";

/**
 * Cria o DocumentIntakeRuntimePort para o provedor solicitado.
 *
 * Default de produção: DefaultDocumentIntakeRuntimeAdapter
 * (Orchestrator + DocumentIntakePort via enterpriseDeps).
 */
export function createDocumentIntakeRuntimePort(
  options: DocumentIntakeRuntimeProviderOptions = {},
): DocumentIntakeRuntimePort {
  return createDocumentIntakeRuntimeFactory({
    enterpriseDeps: options.enterpriseDeps,
  }).create(options);
}
