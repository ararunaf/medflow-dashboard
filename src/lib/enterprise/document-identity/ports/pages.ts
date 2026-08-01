/**
 * Helpers estruturais de páginas — EPC-08 FASE 6.
 *
 * Nenhuma informação clínica. Apenas sequência e geometria genérica.
 */
import type { DocumentIdentity, DocumentPage, PageId } from "./types";

/** Ordena páginas por sequence ascendente. */
export function sortPagesBySequence(pages: readonly DocumentPage[]): DocumentPage[] {
  return [...pages].sort((a, b) => a.sequence - b.sequence);
}

/** Conta páginas de um documento. */
export function getPageCount(document: DocumentIdentity): number {
  return document.pages?.length ?? 0;
}

/** Obtém página por PageId. */
export function findPageById(document: DocumentIdentity, pageId: PageId): DocumentPage | undefined {
  return document.pages?.find((page) => page.pageId === pageId);
}

/** Obtém página por sequence. */
export function findPageBySequence(
  document: DocumentIdentity,
  sequence: number,
): DocumentPage | undefined {
  return document.pages?.find((page) => page.sequence === sequence);
}

/** Normaliza sequence para 1-based contíguo (infra; não valida conteúdo). */
export function resequencePages(pages: readonly DocumentPage[]): DocumentPage[] {
  return sortPagesBySequence(pages).map((page, index) => ({
    ...page,
    sequence: index + 1,
  }));
}
