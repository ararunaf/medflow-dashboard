/**
 * Provider / factory do HealthcareModelPort — inversão de dependência (EPC-19 / FASE 5).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * diretamente no Domain.
 *
 * Default: DefaultHealthcareModelAdapter.
 */
import { createHealthcareModelFactory } from "../factory/healthcare-model-factory";
import type { HealthcareModelPort } from "../ports/healthcare-model-port";
import type { HealthcareModelProviderOptions } from "../ports/types";

/**
 * Cria o HealthcareModelPort para o mecanismo solicitado.
 *
 * Default de produção da fundação: DefaultHealthcareModelAdapter
 * (store in-process).
 */
export function createHealthcareModelPort(
  options: HealthcareModelProviderOptions = {},
): HealthcareModelPort {
  return createHealthcareModelFactory().create(options);
}
