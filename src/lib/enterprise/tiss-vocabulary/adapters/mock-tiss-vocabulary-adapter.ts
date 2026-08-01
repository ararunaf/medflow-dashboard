/**
 * MockTISSVocabularyAdapter — EPC-20 / FASE 3.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
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
  TISSVocabularyProviderId,
} from "../ports/types";
import { DefaultTISSVocabularyStore, type TISSVocabularyStore } from "../store";

export const MOCK_TISS_VOCABULARY_ADAPTER_ID = "mock-in-memory";
export const MOCK_TISS_VOCABULARY_VERSION = "1.0.0";

export type MockTISSVocabularyAdapterOptions = {
  provider?: Extract<TISSVocabularyProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: TISSVocabularyStore;
  createId?: (category?: string) => string;
  now?: () => string;
};

export class MockTISSVocabularyAdapter implements TISSVocabularyPort {
  readonly providerId: Extract<TISSVocabularyProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: TISSVocabularyStore;
  private readonly createId: (category?: string) => string;
  private readonly now?: () => string;

  constructor(options: MockTISSVocabularyAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} tiss-vocabulary ready.`;
    this.store = options.store ?? new DefaultTISSVocabularyStore();
    this.createId = options.createId ?? createTISSConceptId;
    this.now = options.now;
  }

  getStore(): TISSVocabularyStore {
    return this.store;
  }

  capabilities(): TISSVocabularyCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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

  async health(): Promise<TISSVocabularyHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedConceptCount: this.store.conceptCount(),
      storedRelationshipCount: this.store.relationshipCount(),
    };
  }

  async registerConcept(input: RegisterConceptInput): Promise<RegisterConceptResult> {
    if (!this.healthy) {
      return { ok: false, code: "unhealthy", message: this.message };
    }

    const stamp = this.now?.() ?? new Date().toISOString();
    const id = input.concept.id || this.createId(input.concept.category);
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
    if (!this.healthy) {
      return { ok: false, code: "unhealthy", message: this.message };
    }

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
    if (!this.healthy) {
      return { ok: false, concepts: [], code: "unhealthy", message: this.message };
    }

    const concepts = this.store.listConcepts().filter((concept) => {
      if (input.category != null && concept.category !== input.category) return false;
      if (input.status != null && concept.status !== input.status) return false;
      if (input.tag != null && !(concept.tags ?? []).includes(input.tag)) return false;
      if (
        input.conceptCodePrefix != null &&
        !concept.conceptCode.startsWith(input.conceptCodePrefix)
      ) {
        return false;
      }
      return true;
    });
    return { ok: true, concepts, code: "listed" };
  }
}
