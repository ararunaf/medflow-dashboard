/**
 * Provider / factory do TISSProfilePort — inversão de dependência (EPC-22 / FASE 5).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * diretamente no Domain.
 *
 * Default: DefaultTISSProfileAdapter.
 */
import { createTISSProfileFactory } from "../factory/tiss-profile-factory";
import type { TISSProfilePort } from "../ports/tiss-profile-port";
import type { TISSProfileProviderOptions } from "../ports/types";

/**
 * Cria o TISSProfilePort para o mecanismo solicitado.
 *
 * Default de produção da fundação: DefaultTISSProfileAdapter
 * (store in-process).
 */
export function createTISSProfilePort(options: TISSProfileProviderOptions = {}): TISSProfilePort {
  return createTISSProfileFactory().create(options);
}
