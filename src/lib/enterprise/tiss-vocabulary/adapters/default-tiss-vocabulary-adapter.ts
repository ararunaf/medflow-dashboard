/**
 * DefaultTISSVocabularyAdapter — adapter default in-memory (EPC-20 / FASE 2).
 *
 * Implementação totalmente in-memory.
 * Sem parser XML. Sem validação. Sem regras. Sem banco. Sem operadoras.
 */
import { createTISSConceptId } from "../ports/identity";
import type { TISSVocabularyPort } from "../ports/tiss-vocabulary-port";
import type { TISSConcept } from "../ports/models";
import type {
  GetConceptInput,
  GetConceptResult,
  ListConceptsInput,
  ListConceptsResult,
  RegisterConceptInput,
  RegisterConceptResult,
  TISSVocabularyCapabilities,
  TISSVocabularyHealth,
} from "../ports/types";
import { DefaultTISSVocabularyStore, type TISSVocabularyStore } from "../store";

export const DEFAULT_TISS_VOCABULARY_ADAPTER_ID = "default-in-process";
export const DEFAULT_TISS_VOCABULARY_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultTISSVocabularyRuntime = {
  /** Store ativo. Default: DefaultTISSVocabularyStore in-process. */
  store?: TISSVocabularyStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de id injetável (testes). */
  createId?: (category?: string) => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultTISSVocabularyRuntime {
  return {
    store: new DefaultTISSVocabularyStore(),
  };
}

function nowIso(runtime: DefaultTISSVocabularyRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

function foundationCapabilities(
  provider: "default",
  adapterId: string,
): TISSVocabularyCapabilities {
  return {
    provider,
    adapterId,
    supportsRegisterConcept: true,
    supportsGetConcept: true,
    supportsListConcepts: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsCanonicalVocabulary: true,
    supportsStructuralRelationships: true,
    supportsFutureTissMapping: true,
    supportsFutureHealthcareModel: true,
    supportsFutureRuleEngine: true,
    supportsFutureWorkflow: true,
    supportsFutureAiAuditor: true,
    supportsFutureOcr: true,
    independentOfXmlLayout: true,
    independentOfXmlVersion: true,
    supportsFutureMultiVersionTiss: true,
    implementsXmlParser: false,
    implementsTissValidation: false,
    implementsRules: false,
    knowsOperatorOrCooperative: false,
  };
}

export class DefaultTISSVocabularyAdapter implements TISSVocabularyPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultTISSVocabularyRuntime;
  private readonly store: TISSVocabularyStore;

  constructor(runtime: DefaultTISSVocabularyRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultTISSVocabularyStore();
  }

  /** Acesso estrutural ao store (testes / demo). */
  getStore(): TISSVocabularyStore {
    return this.store;
  }

  capabilities(): TISSVocabularyCapabilities {
    return foundationCapabilities("default", DEFAULT_TISS_VOCABULARY_ADAPTER_ID);
  }

  async health(): Promise<TISSVocabularyHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok
            ? "Default tiss-vocabulary probe ok."
            : "Default tiss-vocabulary probe falhou."),
        storedConceptCount: this.store.conceptCount(),
        storedRelationshipCount: this.store.relationshipCount(),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ?? "DefaultTISSVocabularyStore pronto (sem I/O externo — EPC-20).",
      storedConceptCount: this.store.conceptCount(),
      storedRelationshipCount: this.store.relationshipCount(),
    };
  }

  async registerConcept(input: RegisterConceptInput): Promise<RegisterConceptResult> {
    const stamp = nowIso(this.runtime);
    const id =
      input.concept.id ||
      this.runtime.createId?.(input.concept.category) ||
      createTISSConceptId(input.concept.category);
    const existing = this.store.getConcept(id);

    const concept: TISSConcept = {
      ...input.concept,
      id,
      createdAt: existing?.createdAt ?? input.concept.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.concept.status ?? existing?.status ?? "draft",
      version: input.concept.version ?? existing?.version ?? "1",
    };

    this.store.setConcept(concept);
    return {
      ok: true,
      conceptId: id,
      concept,
      code: existing ? "updated" : "created",
      message: existing ? "concept updated" : "concept registered",
    };
  }

  async getConcept(input: GetConceptInput): Promise<GetConceptResult> {
    let concept: TISSConcept | undefined;

    if (input.conceptId) {
      concept = this.store.getConcept(input.conceptId);
    } else if (input.conceptCode) {
      concept = this.store.getConceptByCode(input.conceptCode);
    } else {
      return { ok: false, code: "invalid_input", message: "conceptId or conceptCode required" };
    }

    if (!concept) {
      return { ok: false, code: "not_found", message: "not found" };
    }
    if (input.category != null && concept.category !== input.category) {
      return { ok: false, code: "category_mismatch", message: "category mismatch" };
    }
    return { ok: true, concept, code: "found" };
  }

  async listConcepts(input: ListConceptsInput = {}): Promise<ListConceptsResult> {
    const concepts = this.store.listConcepts().filter((concept) => matchesList(concept, input));
    return { ok: true, concepts, code: "listed" };
  }
}

function matchesList(concept: TISSConcept, input: ListConceptsInput): boolean {
  if (input.category != null && concept.category !== input.category) return false;
  if (input.status != null && concept.status !== input.status) return false;
  if (input.tag != null && !(concept.tags ?? []).includes(input.tag)) return false;
  if (input.conceptCodePrefix != null && !concept.conceptCode.startsWith(input.conceptCodePrefix)) {
    return false;
  }
  return true;
}
