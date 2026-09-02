/**
 * EnterpriseTISSCatalogStore — singleton compartilhado do catálogo real (TISS-02-DATA).
 *
 * Continua sendo um TISSCatalogStore comum (InMemoryTISSCatalog) — o Port/Adapter
 * não mudam. A diferença é que este store é um singleton endereçável de fora,
 * para que um binder server-only (src/lib/server/tiss-catalog-backend.ts) possa
 * hidratá-lo com linhas reais de TUSS/CID-10 vindas do Supabase, em vez de deixar
 * cada adapter criar sua própria cópia privada do seed mínimo de 12 códigos.
 *
 * Este módulo não importa Supabase nem `@/lib/server/*` — mantém a fronteira
 * client/server (importProtection). Ele só sabe mutar o store; quem busca os
 * dados é o binder.
 */
import { InMemoryTISSCatalog } from "./in-memory-tiss-catalog";
import type {
  StoredTISSProcedureGroup,
  StoredTISSProcedureType,
  StoredTISSVocabularyEntry,
} from "./tiss-catalog-store";

/** Linha real de procedimento TUSS, já normalizada (código com 6–8 dígitos). */
export type RealTissProcedureRow = {
  code: string;
  name: string;
  groupCode?: string;
  category?: string;
  requiresAuthorization?: boolean;
  ansEdition?: string;
};

/** Linha real de CID-10, já normalizada (ver normalizeCid). */
export type RealCid10Row = {
  code: string;
  description: string;
  chapter?: string;
};

export type EnterpriseTissCatalogHydrationSummary = {
  proceduresLoaded: number;
  cid10CodesLoaded: number;
  hydratedAt: string;
  source: string;
};

let sharedStore: InMemoryTISSCatalog | undefined;
let lastHydration: EnterpriseTissCatalogHydrationSummary | undefined;

/**
 * Store canônico compartilhado — usado pelos providers "default"/"enterprise"
 * do TISSCatalogFactory. Começa com o mesmo seed mínimo de sempre (zero
 * mudança de comportamento) até que applyReal*() seja chamado pelo binder.
 */
export function getSharedEnterpriseTISSCatalogStore(): InMemoryTISSCatalog {
  if (!sharedStore) {
    sharedStore = new InMemoryTISSCatalog();
  }
  return sharedStore;
}

/** Testes — permite isolar o singleton entre casos. */
export function resetSharedEnterpriseTISSCatalogStoreForTests(): void {
  sharedStore = undefined;
  lastHydration = undefined;
}

function ensureProcedureGroup(store: InMemoryTISSCatalog, groupCode: string): void {
  if (store.getProcedureGroup(groupCode)) return;
  const entry: StoredTISSProcedureGroup = {
    kind: "canonical-tiss-procedure-group",
    entryKind: "procedure-group",
    id: `pgroup-${groupCode}`,
    code: groupCode,
    name: groupCode,
    status: "active",
    tags: ["procedure-group", "auto-imported"],
  };
  store.setProcedureGroup(entry);
}

/** Aplica linhas reais de procedimentos TUSS ao store compartilhado (upsert por código). */
export function applyRealTissProcedures(
  rows: readonly RealTissProcedureRow[],
  store: InMemoryTISSCatalog = getSharedEnterpriseTISSCatalogStore(),
): number {
  for (const row of rows) {
    const groupCode = row.groupCode ?? "group-importado";
    ensureProcedureGroup(store, groupCode);
    const entry: StoredTISSProcedureType = {
      kind: "canonical-tiss-procedure-type",
      entryKind: "procedure-type",
      id: `ptype-tuss-${row.code}`,
      code: row.code,
      name: row.name,
      status: "active",
      groupCode,
      category: row.category,
      tags: ["procedure-type", "tuss-procedure", "real-catalog"],
      customAttributes: {
        requiresAuthorization: row.requiresAuthorization ?? false,
        ...(row.ansEdition ? { ansEdition: row.ansEdition } : {}),
      },
    };
    store.setProcedureType(entry);
  }
  return rows.length;
}

/**
 * Aplica linhas reais de CID-10 ao store compartilhado, reaproveitando o bucket
 * de vocabulário canônico (category="diagnostico") — o Port/Store não têm um
 * bucket dedicado a tabelas de diagnóstico, e criar um novo bucket exigiria
 * mudar TISSCatalogPort/Adapter/testes em toda a Foundation. `code` = CID
 * normalizado (ver normalizeCid), `conceptCode` identifica a fonte.
 */
export function applyRealCid10Codes(
  rows: readonly RealCid10Row[],
  store: InMemoryTISSCatalog = getSharedEnterpriseTISSCatalogStore(),
): number {
  for (const row of rows) {
    const entry: StoredTISSVocabularyEntry = {
      kind: "canonical-tiss-vocabulary-entry",
      entryKind: "vocabulary-entry",
      id: `vocab-cid-${row.code}`,
      code: row.code,
      name: row.description,
      status: "active",
      category: "diagnostico",
      conceptCode: "diagnostico.cid10",
      tags: ["vocabulary", "cid10", "diagnosis-code", "real-catalog"],
      customAttributes: row.chapter ? { chapter: row.chapter } : undefined,
    };
    store.setVocabularyEntry(entry);
  }
  return rows.length;
}

export function markEnterpriseTissCatalogHydrated(
  summary: EnterpriseTissCatalogHydrationSummary,
): void {
  lastHydration = summary;
  const store = getSharedEnterpriseTISSCatalogStore();
  const current = store.getMetadata();
  store.setMetadata({
    kind: "canonical-tiss-catalog-metadata",
    entryKind: "metadata",
    catalogId: current?.catalogId ?? store.catalogId,
    namespace: current?.namespace ?? "enterprise.tiss.catalog",
    channel: current?.channel ?? "foundation",
    tags: ["canonical", "tiss-02", "tiss-02-data"],
    customAttributes: {
      seedLevel: "real-catalog-hydrated",
      completeCatalogLoaded: summary.proceduresLoaded > 0 && summary.cid10CodesLoaded > 0,
      proceduresLoaded: summary.proceduresLoaded,
      cid10CodesLoaded: summary.cid10CodesLoaded,
      hydratedAt: summary.hydratedAt,
      source: summary.source,
    },
  });
}

export function getEnterpriseTissCatalogHydrationSummary():
  | EnterpriseTissCatalogHydrationSummary
  | undefined {
  return lastHydration;
}
