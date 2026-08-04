/**
 * InMemoryXMLTISSRuntimeStore — store in-process oficial (C-01).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem geração de XML funcional).
 */
import type { XMLStatistics } from "../ports/canonical";
import type {
  StoredXMLTISSRuntimeDocument,
  StoredXMLTISSRuntimeResult,
  XMLTISSRuntimeStore,
} from "./xml-tiss-runtime-store";

export const IN_MEMORY_XML_TISS_RUNTIME_STORE_ID = "in-memory-xml-tiss-runtime";

export type InMemoryXMLTISSRuntimeStoreOptions = {
  documents?: readonly StoredXMLTISSRuntimeDocument[];
  results?: readonly StoredXMLTISSRuntimeResult[];
};

export class InMemoryXMLTISSRuntimeStore implements XMLTISSRuntimeStore {
  readonly storeId = IN_MEMORY_XML_TISS_RUNTIME_STORE_ID;

  private readonly documents = new Map<string, StoredXMLTISSRuntimeDocument>();
  private readonly results = new Map<string, StoredXMLTISSRuntimeResult>();

  constructor(options: InMemoryXMLTISSRuntimeStoreOptions = {}) {
    for (const document of options.documents ?? []) this.setDocument(document);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getDocument(documentId: string): StoredXMLTISSRuntimeDocument | undefined {
    const document = this.documents.get(documentId);
    return document ? { ...document } : undefined;
  }

  setDocument(document: StoredXMLTISSRuntimeDocument): void {
    this.documents.set(document.documentId, { ...document });
  }

  removeDocument(documentId: string): void {
    this.documents.delete(documentId);
  }

  listDocuments(): readonly StoredXMLTISSRuntimeDocument[] {
    return Array.from(this.documents.values()).map((document) => ({ ...document }));
  }

  documentCount(): number {
    return this.documents.size;
  }

  getResult(resultId: string): StoredXMLTISSRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredXMLTISSRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredXMLTISSRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): XMLStatistics {
    const documents = this.listDocuments();
    let preparedDocuments = 0;
    let totalGuides = 0;
    let totalBatches = 0;
    for (const document of documents) {
      if (document.status === "prepared") preparedDocuments += 1;
      if (document.guide) totalGuides += 1;
      if (document.batch) totalBatches += 1;
    }
    return {
      kind: "canonical-xml-tiss-statistics",
      totalDocuments: documents.length,
      preparedDocuments,
      totalResults: this.resultCount(),
      totalGuides,
      totalBatches,
      xmlGenerationImplementedCount: 0,
      xmlSerializationImplementedCount: 0,
      xmlParsingImplementedCount: 0,
      xmlValidationImplementedCount: 0,
      xmlSigningImplementedCount: 0,
      xmlCompressionImplementedCount: 0,
      batchXmlGenerationImplementedCount: 0,
      soapIntegrationImplementedCount: 0,
      operatorIntegrationImplementedCount: 0,
      schemaValidationImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `XML TISS Runtime store ready (${this.documentCount()} documents, ${this.resultCount()} results).`,
    };
  }
}
