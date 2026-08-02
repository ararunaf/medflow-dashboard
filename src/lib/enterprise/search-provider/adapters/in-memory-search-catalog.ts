/**
 * Catálogo in-memory de documentos pesquisáveis — SEARCH-01.
 *
 * Não é motor de busca externo. Não acessa Supabase/Azure/S3/FS.
 * Persistência documental permanece exclusiva do StorageProviderPort.
 */
import type {
  CanonicalSearchDocument,
  CanonicalSearchMode,
  CanonicalSearchRequest,
} from "../ports/canonical";

export type InMemorySearchCatalog = {
  upsert(document: CanonicalSearchDocument): void;
  getById(documentId: string): CanonicalSearchDocument | undefined;
  list(): readonly CanonicalSearchDocument[];
  search(request: CanonicalSearchRequest): CanonicalSearchDocument[];
  clear(): void;
  size(): number;
};

function matchesMetadataFilters(
  document: CanonicalSearchDocument,
  filters: Readonly<Record<string, string | number | boolean | null>> | undefined,
): boolean {
  if (!filters || Object.keys(filters).length === 0) return true;
  const attrs = document.metadata?.customAttributes ?? {};
  for (const [key, expected] of Object.entries(filters)) {
    const actual =
      key === "patientId"
        ? (document.patientId ?? attrs.patientId)
        : key === "tenantRef"
          ? (document.tenantRef ?? attrs.tenantRef)
          : key === "competencia"
            ? (document.competencia ?? attrs.competencia)
            : key === "documentId"
              ? document.documentId
              : attrs[key];
    if (actual !== expected) return false;
  }
  return true;
}

function scoreDocument(document: CanonicalSearchDocument, request: CanonicalSearchRequest): number {
  let score = 1;
  if (request.query) {
    const q = request.query.toLowerCase();
    const hay = [
      document.documentId,
      document.title,
      document.documentKind,
      document.patientId,
      document.competencia,
      document.tenantRef,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return 0;
    score += 0.5;
  }
  return score;
}

export function createInMemorySearchCatalog(
  seed: readonly CanonicalSearchDocument[] = [],
): InMemorySearchCatalog {
  const byId = new Map<string, CanonicalSearchDocument>();
  for (const doc of seed) {
    byId.set(doc.documentId, { ...doc, kind: "canonical-search-document" });
  }

  return {
    upsert(document) {
      byId.set(document.documentId, { ...document, kind: "canonical-search-document" });
    },
    getById(documentId) {
      const found = byId.get(documentId);
      return found ? { ...found } : undefined;
    },
    list() {
      return Array.from(byId.values()).map((d) => ({ ...d }));
    },
    search(request) {
      const limit = request.limit && request.limit > 0 ? Math.floor(request.limit) : 100;
      const mode: CanonicalSearchMode = request.mode;
      const all = Array.from(byId.values());
      let hits: CanonicalSearchDocument[] = [];

      switch (mode) {
        case "by-id": {
          const id = request.documentId;
          if (!id) break;
          const found = byId.get(id);
          if (found) hits = [found];
          break;
        }
        case "by-document": {
          const id = request.documentId;
          const kind = request.documentKind;
          hits = all.filter((doc) => {
            if (id && doc.documentId !== id) return false;
            if (kind && doc.documentKind !== kind) return false;
            if (request.query) return scoreDocument(doc, request) > 0;
            return Boolean(id || kind || request.query);
          });
          break;
        }
        case "by-patient": {
          const patientId = request.patientId ?? request.metadata.patientId;
          if (!patientId) break;
          hits = all.filter((doc) => doc.patientId === patientId);
          break;
        }
        case "by-tenant": {
          const tenantRef = request.tenantRef ?? request.metadata.tenantRef;
          if (!tenantRef) break;
          hits = all.filter((doc) => doc.tenantRef === tenantRef);
          break;
        }
        case "by-competencia": {
          const competencia = request.competencia ?? request.metadata.competencia;
          if (!competencia) break;
          hits = all.filter((doc) => doc.competencia === competencia);
          break;
        }
        case "by-metadata": {
          hits = all.filter((doc) => matchesMetadataFilters(doc, request.metadataFilters));
          if (request.query) {
            hits = hits.filter((doc) => scoreDocument(doc, request) > 0);
          }
          break;
        }
        default:
          hits = [];
      }

      return hits
        .map((doc) => ({
          ...doc,
          score: scoreDocument(doc, request) || 1,
        }))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, limit);
    },
    clear() {
      byId.clear();
    },
    size() {
      return byId.size;
    },
  };
}
