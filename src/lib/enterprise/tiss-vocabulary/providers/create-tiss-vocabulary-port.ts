/**
 * Provider / factory do TISSVocabularyPort — inversão de dependência (EPC-20 / FASE 5).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * diretamente no Domain.
 *
 * Default: DefaultTISSVocabularyAdapter.
 */
import { createTISSVocabularyFactory } from "../factory/tiss-vocabulary-factory";
import type { TISSVocabularyPort } from "../ports/tiss-vocabulary-port";
import type { TISSVocabularyProviderOptions } from "../ports/types";

/**
 * Cria o TISSVocabularyPort para o mecanismo solicitado.
 *
 * Default de produção da fundação: DefaultTISSVocabularyAdapter
 * (store in-process).
 */
export function createTISSVocabularyPort(
  options: TISSVocabularyProviderOptions = {},
): TISSVocabularyPort {
  return createTISSVocabularyFactory().create(options);
}
