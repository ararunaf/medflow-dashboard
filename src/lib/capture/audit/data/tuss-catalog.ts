/**
 * Facade Capture → Enterprise TISS knowledge (TISS-CONV-01).
 *
 * Não possui catálogo paralelo. Conhecimento exclusivamente via:
 *   Enterprise Runtime → TISS Runtime → TISSCatalogPort → RulePackEnginePort
 *
 * Chame ensureCaptureTissKnowledge() (ou auditStructuredGuide async) antes do uso síncrono.
 */
import {
  ensureCaptureTissKnowledge,
  getCaptureTissKnowledgeSnapshot,
  getEnterpriseTissVersionLabel,
  isTussInCatalogFromEnterprise,
  tussRequiresAuthorizationFromEnterprise,
} from "../../enterprise/tiss-knowledge-gateway";

export { ensureCaptureTissKnowledge, getEnterpriseTissVersionLabel };

export function isTussInCatalog(code: string): boolean {
  return isTussInCatalogFromEnterprise(code);
}

export function tussRequiresAuthorization(code: string): boolean {
  return tussRequiresAuthorizationFromEnterprise(code);
}

/** Visão síncrona do catálogo TUSS — backed by TISSCatalogPort (após hidratação). */
export function getTussCatalogCodes(): ReadonlySet<string> {
  return getCaptureTissKnowledgeSnapshot().procedureCodes;
}

/**
 * @deprecated Prefer getTussCatalogCodes() — mantido para compatibilidade de export.
 * Getter vivo do snapshot Enterprise (não é Set hardcoded).
 */
export const TUSS_CATALOG: ReadonlySet<string> = {
  get size() {
    return getCaptureTissKnowledgeSnapshot().procedureCodes.size;
  },
  has(code: string) {
    return isTussInCatalog(String(code));
  },
  keys() {
    return getCaptureTissKnowledgeSnapshot().procedureCodes.keys();
  },
  values() {
    return getCaptureTissKnowledgeSnapshot().procedureCodes.values();
  },
  entries() {
    return getCaptureTissKnowledgeSnapshot().procedureCodes.entries();
  },
  forEach(callback, thisArg) {
    getCaptureTissKnowledgeSnapshot().procedureCodes.forEach(callback, thisArg);
  },
  [Symbol.iterator]() {
    return getCaptureTissKnowledgeSnapshot().procedureCodes[Symbol.iterator]();
  },
  get [Symbol.toStringTag]() {
    return "Set";
  },
} as ReadonlySet<string>;

/** UFs válidas para CRM/CRO — conhecimento geográfico BR (não dual-path TISS). */
export const VALID_UF_CODES = new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]);
