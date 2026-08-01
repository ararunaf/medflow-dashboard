/**
 * ProfileRelationship helpers — representação estrutural (EPC-22 / FASE 7).
 *
 * Relacionamentos esperados entre conceitos de um Profile.
 * Somente representação. Sem lógica. Sem validação. Sem regras.
 */

import type { ProfileVersionFamily } from "./models";

/**
 * Pipeline arquitetural obrigatório (documentação estrutural).
 *
 * Origem → Mapping → Vocabulary → Profile → Healthcare Model → Rule Engine → AI Auditor
 */
export const PROFILE_PIPELINE = [
  "origem",
  "tiss-mapping",
  "tiss-vocabulary",
  "tiss-profile",
  "healthcare-model",
  "rule-engine",
  "ai-auditor",
] as const;

/**
 * Cadeia estrutural documentada (não executável).
 * Serve como referência de modelagem — sem runtime.
 */
export const PROFILE_STRUCTURAL_CHAIN = [
  "profile",
  "profile-concept",
  "profile-relationship",
  "profile-version",
  "profile-metadata",
] as const;

/**
 * Famílias de versão preparadas (infraestrutura — sem implementação).
 */
export const PROFILE_PREPARED_VERSION_FAMILIES = [
  "tiss-4.x",
  "tiss-5.x",
  "proprietary",
] as const satisfies readonly ProfileVersionFamily[];
