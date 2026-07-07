/**
 * Catálogo TUSS MVP — códigos válidos para validação estrutural.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 *
 * Baseado em procedimentos comuns em guias de teste e catálogo ANS simplificado.
 */
export const TUSS_CATALOG: ReadonlySet<string> = new Set([
  "10101012", // Consulta em consultório
  "10101020", // Consulta em domicílio
  "10101039", // Consulta em pronto socorro
  "20101015", // Eletrocardiograma
  "40101010", // Ecocardiograma transtorácico
  "40101028", // Ecocardiograma transesofágico
  "40301010", // Hemograma completo
  "31001016", // Anestesia geral
  "31001024", // Anestesia regional
  "40801063", // Ressonância magnética
  "40901017", // Tomografia computadorizada
  "30101018", // Cirurgia ambulatorial
]);

export function isTussInCatalog(code: string): boolean {
  const normalized = code.replace(/\D/g, "").padStart(8, "0");
  return TUSS_CATALOG.has(normalized);
}

/** Procedimentos que exigem autorização prévia (MVP simplificado) */
export const TUSS_REQUIRES_AUTH: ReadonlySet<string> = new Set([
  "40101010",
  "40101028",
  "40801063",
  "40901017",
  "31001016",
  "31001024",
  "30101018",
]);

export function tussRequiresAuthorization(code: string): boolean {
  const normalized = code.replace(/\D/g, "").padStart(8, "0");
  return TUSS_REQUIRES_AUTH.has(normalized);
}

/** UFs válidas para CRM/CRO */
export const VALID_UF_CODES = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);
