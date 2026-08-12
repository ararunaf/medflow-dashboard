/**
 * DocumentExtractionRuntimeRegistry — catálogo de mecanismos (F3-CAP-07).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem extração real. Sem OCR/IA/ML/LLM.
 */
import {
  DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
  DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
} from "../adapters/default-document-extraction-runtime-adapter";
import {
  DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
  MOCK_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-document-extraction-runtime-adapter";
import {
  REAL_TISS_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
  REAL_TISS_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
} from "../adapters/real-tiss-document-extraction-runtime-adapter";
import {
  DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  DocumentExtractionRuntimeProviderId,
  DocumentExtractionRuntimeRegistration,
  DocumentExtractionRuntimeStatus,
} from "../ports/types";

export type DocumentExtractionRuntimeRegistrySnapshot = {
  registrations: readonly DocumentExtractionRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly DocumentExtractionRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Document Extraction Runtime",
    version: DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Document Extraction Runtime mock — no real extraction, no network.",
  },
  {
    providerId: "test",
    name: "Test Document Extraction Runtime",
    version: DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Document Extraction Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Document Extraction Runtime",
    version: DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-07).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Document Extraction Runtime",
    version: DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official F3-CAP-07 Enterprise Document Extraction Runtime — structural job/request/document orchestration foundation (no real extraction).",
  },
  {
    providerId: "real-tiss",
    name: "Real TISS Document Extraction Runtime",
    version: REAL_TISS_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
    status: "ready",
    adapterId: REAL_TISS_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Real TISS Document Extraction Runtime — invokes TissParser over RawOcrResult and produces canonical StructuredGuide.",
  },
];

export class DocumentExtractionRuntimeRegistry {
  private readonly byId = new Map<
    DocumentExtractionRuntimeProviderId,
    DocumentExtractionRuntimeRegistration
  >();

  constructor(seed: readonly DocumentExtractionRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: DocumentExtractionRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(
    providerId: DocumentExtractionRuntimeProviderId,
  ): DocumentExtractionRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: DocumentExtractionRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly DocumentExtractionRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(
    status: DocumentExtractionRuntimeStatus,
  ): readonly DocumentExtractionRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): DocumentExtractionRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultDocumentExtractionRuntimeRegistry(): DocumentExtractionRuntimeRegistry {
  return new DocumentExtractionRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_DOCUMENT_EXTRACTION_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
