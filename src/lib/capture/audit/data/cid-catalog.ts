/**
 * Facade Capture → Enterprise TISS knowledge — CID-10 (TISS-02-DATA).
 *
 * Espelha tuss-catalog.ts: não possui tabela paralela. Conhecimento
 * exclusivamente via Enterprise Runtime → TISSCatalogPort. Chame
 * ensureCaptureTissKnowledge() antes do uso síncrono.
 */
import { isCidInCatalogFromEnterprise } from "../../enterprise/tiss-knowledge-gateway";

export function isCidInCatalog(code: string): boolean {
  return isCidInCatalogFromEnterprise(code);
}
