/**
 * DefaultEnterpriseRuntime — composição oficial da Foundation
 * (ARCH-01 / DIP-01…DIP-06 / ARCH-02 DIP-07).
 *
 * Ponto único de acesso do produto aos Ports Enterprise.
 * Bridge Captura → CaptureEngineRuntimePort → Orchestrator → DocumentIntakeRuntime
 *   → DocumentIntakePort → Adapter → Implementação existente
 *   → OCRRuntimePort → Orchestrator → OCRProviderPort → Azure Adapter (OCR-01)
 *   → DocumentClassificationRuntimePort → Orchestrator
 *   → DocumentClassificationProviderPort → DefaultDocumentClassificationAdapter (CLASS-01)
 *   → StorageManagerRuntimePort → Orchestrator
 *   → StorageProviderPort → DefaultStorageProviderAdapter (STORAGE-01)
 *   → DocumentSearchRuntimePort → Orchestrator
 *   → SearchProviderPort → DefaultSearchProviderAdapter (SEARCH-01)
 *   → TISSRuntimePort → TISSCatalogPort → Catalog Adapter → Store (TISS-02)
 *   → TISSRuntimePort → RulePackEnginePort → Rule Pack Adapter → Store (TISS-03)
 *   → TISSRuntimePort → XMLRuntimePort → XMLGenerationRuntimePort → XMLSerializerRuntimePort → XMLSchemaRuntimePort → XMLValidationRuntimePort → XSDRuntimePort → NamespaceRuntimePort → Store (TISS-04…TISS-10)
 *   → TISSRuntimePort → Orchestrator → TISSProviderPort → DefaultTISSProviderAdapter (TISS-01)
 *   → AIProviderRuntimePort → Orchestrator → AIProviderPort → Adapter → OpenAI.
 * OCR: exclusivamente via OCR Runtime → OCRProviderPort (OCR-01) — sem bypass HTTP Azure.
 * Storage: exclusivamente via Storage Manager Runtime → StorageProviderPort (STORAGE-01).
 * Search: exclusivamente via Document Search Runtime → SearchProviderPort (SEARCH-01).
 * TISS: exclusivamente via TISS Runtime → TISSCatalogPort + RulePackEnginePort + XMLRuntimePort + XMLGenerationRuntimePort + XMLSerializerRuntimePort + XMLSchemaRuntimePort + XMLValidationRuntimePort + XSDRuntimePort + NamespaceRuntimePort + TISSProviderPort — sem XML TISS/ANS real/operadoras.
 * IA: exclusivamente via AI Provider Runtime (ARCH-02) — sem bypass HTTP.
 */
import { createAIProviderPort } from "../ai-provider/providers/create-ai-provider-port";
import type { AIProviderPort } from "../ai-provider/ports/ai-provider-port";
import { createAIProviderRuntimePort } from "../ai-provider-runtime/providers/create-ai-provider-runtime-port";
import type { AIProviderRuntimePort } from "../ai-provider-runtime/ports/ai-provider-runtime-port";
import { createCanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/providers/create-canonical-execution-orchestrator-port";
import type { CanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import { createCaptureEngineRuntimePort } from "../capture-engine-runtime/providers/create-capture-engine-runtime-port";
import type { CaptureEngineRuntimePort } from "../capture-engine-runtime/ports/capture-engine-runtime-port";
import type { CanonicalCaptureRequest } from "../capture-engine-runtime/ports/models";
import { createDocumentClassificationProviderPort } from "../document-classification-provider/providers/create-document-classification-provider-port";
import type { DocumentClassificationProviderPort } from "../document-classification-provider/ports/document-classification-provider-port";
import { createDocumentClassificationRuntimePort } from "../document-classification-runtime/providers/create-document-classification-runtime-port";
import type { DocumentClassificationRuntimePort } from "../document-classification-runtime/ports/document-classification-runtime-port";
import { createDocumentIntakePort } from "../document-intake/providers/create-document-intake-port";
import type { DocumentIntakePort } from "../document-intake/ports/document-intake-port";
import { createDocumentIntakeRuntimePort } from "../document-intake-runtime/providers/create-document-intake-runtime-port";
import type { DocumentIntakeRuntimePort } from "../document-intake-runtime/ports/document-intake-runtime-port";
import { createDocumentSearchRuntimePort } from "../document-search-runtime/providers/create-document-search-runtime-port";
import type { DocumentSearchRuntimePort } from "../document-search-runtime/ports/document-search-runtime-port";
import { createSearchProviderPort } from "../search-provider/providers/create-search-provider-port";
import type { SearchProviderPort } from "../search-provider/ports/search-provider-port";
import { createOCRProviderPort } from "../ocr-provider/providers/create-ocr-provider-port";
import type { OCRProviderPort } from "../ocr-provider/ports/ocr-provider-port";
import { createOCRRuntimePort } from "../ocr-runtime/providers/create-ocr-runtime-port";
import type { OCRRuntimePort } from "../ocr-runtime/ports/ocr-runtime-port";
import { createStorageManagerRuntimePort } from "../storage-manager-runtime/providers/create-storage-manager-runtime-port";
import type { StorageManagerRuntimePort } from "../storage-manager-runtime/ports/storage-manager-runtime-port";
import { createStorageProviderPort } from "../storage-provider/providers/create-storage-provider-port";
import type { StorageProviderPort } from "../storage-provider/ports/storage-provider-port";
import { createRulePackEnginePort } from "../rule-pack-engine/providers/create-rule-pack-engine-port";
import type { RulePackEnginePort } from "../rule-pack-engine/ports/rule-pack-engine-port";
import { createTISSCatalogPort } from "../tiss-catalog/providers/create-tiss-catalog-port";
import type { TISSCatalogPort } from "../tiss-catalog/ports/tiss-catalog-port";
import { createTISSProviderPort } from "../tiss-provider/providers/create-tiss-provider-port";
import type { TISSProviderPort } from "../tiss-provider/ports/tiss-provider-port";
import { createTISSRuntimePort } from "../tiss-runtime/providers/create-tiss-runtime-port";
import type { TISSRuntimePort } from "../tiss-runtime/ports/tiss-runtime-port";
import { createXMLGenerationRuntimePort } from "../xml-generation-runtime/providers/create-xml-generation-runtime-port";
import type { XMLGenerationRuntimePort } from "../xml-generation-runtime/ports/xml-generation-runtime-port";
import { createXMLRuntimePort } from "../xml-runtime/providers/create-xml-runtime-port";
import type { XMLRuntimePort } from "../xml-runtime/ports/xml-runtime-port";
import { createXMLSchemaRuntimePort } from "../xml-schema-runtime/providers/create-xml-schema-runtime-port";
import type { XMLSchemaRuntimePort } from "../xml-schema-runtime/ports/xml-schema-runtime-port";
import { createXMLSerializerRuntimePort } from "../xml-serializer-runtime/providers/create-xml-serializer-runtime-port";
import type { XMLSerializerRuntimePort } from "../xml-serializer-runtime/ports/xml-serializer-runtime-port";
import { createXMLValidationRuntimePort } from "../xml-validation-runtime/providers/create-xml-validation-runtime-port";
import type { XMLValidationRuntimePort } from "../xml-validation-runtime/ports/xml-validation-runtime-port";
import { createXSDRuntimePort } from "../xsd-runtime/providers/create-xsd-runtime-port";
import type { XSDRuntimePort } from "../xsd-runtime/ports/xsd-runtime-port";
import { createNamespaceRuntimePort } from "../namespace-runtime/providers/create-namespace-runtime-port";
import type { NamespaceRuntimePort } from "../namespace-runtime/ports/namespace-runtime-port";
import type {
  EnterpriseRuntime,
  EnterpriseRuntimeHealth,
  EnterpriseRuntimeOptions,
  RegisterCaptureDocumentIntakeInput,
  RegisterCaptureDocumentIntakeResult,
} from "./types";

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export class DefaultEnterpriseRuntime implements EnterpriseRuntime {
  readonly runtimeId;
  private readonly documentIntakePort: DocumentIntakePort;
  private readonly orchestratorPort: CanonicalExecutionOrchestratorPort;
  private readonly documentIntakeRuntimePort: DocumentIntakeRuntimePort;
  private readonly ocrProviderPort: OCRProviderPort;
  private readonly ocrRuntimePort: OCRRuntimePort;
  private readonly documentClassificationProviderPort: DocumentClassificationProviderPort;
  private readonly documentClassificationRuntimePort: DocumentClassificationRuntimePort;
  private readonly storageProviderPort: StorageProviderPort;
  private readonly storageManagerRuntimePort: StorageManagerRuntimePort;
  private readonly searchProviderPort: SearchProviderPort;
  private readonly documentSearchRuntimePort: DocumentSearchRuntimePort;
  private readonly tissProviderPort: TISSProviderPort;
  private readonly tissCatalogPort: TISSCatalogPort;
  private readonly rulePackEnginePort: RulePackEnginePort;
  private readonly xmlGenerationRuntimePort: XMLGenerationRuntimePort;
  private readonly xmlRuntimePort: XMLRuntimePort;
  private readonly xmlSerializerRuntimePort: XMLSerializerRuntimePort;
  private readonly xmlSchemaRuntimePort: XMLSchemaRuntimePort;
  private readonly xmlValidationRuntimePort: XMLValidationRuntimePort;
  private readonly xsdRuntimePort: XSDRuntimePort;
  private readonly namespaceRuntimePort: NamespaceRuntimePort;
  private readonly tissRuntimePort: TISSRuntimePort;
  private readonly captureEngineRuntimePort: CaptureEngineRuntimePort;
  private readonly aiProviderPort: AIProviderPort;
  private readonly aiProviderRuntimePort: AIProviderRuntimePort;

  constructor(options: EnterpriseRuntimeOptions = {}) {
    this.runtimeId = options.runtimeId ?? "default";
    this.documentIntakePort =
      options.documentIntakePort ?? createDocumentIntakePort({ provider: "default" });
    this.orchestratorPort =
      options.orchestratorPort ?? createCanonicalExecutionOrchestratorPort({ provider: "default" });
    this.documentIntakeRuntimePort =
      options.documentIntakeRuntimePort ??
      createDocumentIntakeRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getDocumentIntakePort: () => this.documentIntakePort,
          getOrchestratorPort: () => this.orchestratorPort,
        },
      });
    // OCR-01: Azure Document Intelligence oficial atrás do OCRProviderPort — sem bypass no produto.
    this.ocrProviderPort = options.ocrProviderPort ?? createOCRProviderPort({ provider: "azure" });
    this.ocrRuntimePort =
      options.ocrRuntimePort ??
      createOCRRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getOCRProviderPort: () => this.ocrProviderPort,
        },
      });
    // CLASS-01: Rule-based Document Classification oficial atrás do ProviderPort — sem IA / sem bypass.
    this.documentClassificationProviderPort =
      options.documentClassificationProviderPort ??
      createDocumentClassificationProviderPort({ provider: "rule-based" });
    this.documentClassificationRuntimePort =
      options.documentClassificationRuntimePort ??
      createDocumentClassificationRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getDocumentClassificationProviderPort: () => this.documentClassificationProviderPort,
        },
      });
    // STORAGE-01: Storage Provider oficial atrás do StorageProviderPort — sem bypass no produto.
    this.storageProviderPort =
      options.storageProviderPort ?? createStorageProviderPort({ provider: "supabase" });
    this.storageManagerRuntimePort =
      options.storageManagerRuntimePort ??
      createStorageManagerRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getStorageProviderPort: () => this.storageProviderPort,
        },
      });
    // SEARCH-01: Search Provider oficial atrás do SearchProviderPort — sem bypass no produto.
    this.searchProviderPort =
      options.searchProviderPort ??
      createSearchProviderPort({
        provider: "storage-backed",
        storageProviderPort: this.storageProviderPort,
      });
    this.documentSearchRuntimePort =
      options.documentSearchRuntimePort ??
      createDocumentSearchRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getStorageManagerRuntimePort: () => this.storageManagerRuntimePort,
          getSearchProviderPort: () => this.searchProviderPort,
        },
      });
    this.captureEngineRuntimePort =
      options.captureEngineRuntimePort ??
      createCaptureEngineRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getDocumentIntakeRuntimePort: () => this.documentIntakeRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getStorageManagerRuntimePort: () => this.storageManagerRuntimePort,
          getDocumentSearchRuntimePort: () => this.documentSearchRuntimePort,
        },
      });
    // TISS-01…07: Provider + Catalog + Rule Pack Engine + XML Runtime + Generation + Serializer + Schema — sem XML TISS/ANS real/operadoras.
    this.tissProviderPort =
      options.tissProviderPort ?? createTISSProviderPort({ provider: "enterprise" });
    this.tissCatalogPort =
      options.tissCatalogPort ?? createTISSCatalogPort({ provider: "enterprise" });
    this.rulePackEnginePort =
      options.rulePackEnginePort ??
      createRulePackEnginePort({
        provider: "enterprise",
        enterpriseDeps: {
          getTISSCatalogPort: () => this.tissCatalogPort,
        },
      });
    this.xmlGenerationRuntimePort =
      options.xmlGenerationRuntimePort ??
      createXMLGenerationRuntimePort({ provider: "enterprise" });
    this.xmlRuntimePort =
      options.xmlRuntimePort ??
      createXMLRuntimePort({
        provider: "enterprise",
        enterpriseDeps: {
          getTISSCatalogPort: () => this.tissCatalogPort,
          getRulePackEnginePort: () => this.rulePackEnginePort,
          getXMLGenerationRuntimePort: () => this.xmlGenerationRuntimePort,
        },
      });
    this.xmlSerializerRuntimePort =
      options.xmlSerializerRuntimePort ??
      createXMLSerializerRuntimePort({ provider: "enterprise" });
    this.xmlSchemaRuntimePort =
      options.xmlSchemaRuntimePort ?? createXMLSchemaRuntimePort({ provider: "enterprise" });
    this.xmlValidationRuntimePort =
      options.xmlValidationRuntimePort ??
      createXMLValidationRuntimePort({ provider: "enterprise" });
    this.xsdRuntimePort =
      options.xsdRuntimePort ?? createXSDRuntimePort({ provider: "enterprise" });
    this.namespaceRuntimePort =
      options.namespaceRuntimePort ?? createNamespaceRuntimePort({ provider: "enterprise" });
    this.tissRuntimePort =
      options.tissRuntimePort ??
      createTISSRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getTISSProviderPort: () => this.tissProviderPort,
          getTISSCatalogPort: () => this.tissCatalogPort,
          getRulePackEnginePort: () => this.rulePackEnginePort,
          getXMLRuntimePort: () => this.xmlRuntimePort,
          getXMLGenerationRuntimePort: () => this.xmlGenerationRuntimePort,
          getXMLSerializerRuntimePort: () => this.xmlSerializerRuntimePort,
          getXMLSchemaRuntimePort: () => this.xmlSchemaRuntimePort,
          getXMLValidationRuntimePort: () => this.xmlValidationRuntimePort,
          getXSDRuntimePort: () => this.xsdRuntimePort,
          getNamespaceRuntimePort: () => this.namespaceRuntimePort,
        },
      });
    // ARCH-02: OpenAI oficial atrás do AIProviderPort — sem bypass no produto.
    this.aiProviderPort = options.aiProviderPort ?? createAIProviderPort({ provider: "openai" });
    this.aiProviderRuntimePort =
      options.aiProviderRuntimePort ??
      createAIProviderRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getAIProviderPort: () => this.aiProviderPort,
        },
      });
  }

  getDocumentIntakePort(): DocumentIntakePort {
    return this.documentIntakePort;
  }

  getOrchestratorPort(): CanonicalExecutionOrchestratorPort {
    return this.orchestratorPort;
  }

  getDocumentIntakeRuntimePort(): DocumentIntakeRuntimePort {
    return this.documentIntakeRuntimePort;
  }

  getCaptureEngineRuntimePort(): CaptureEngineRuntimePort {
    return this.captureEngineRuntimePort;
  }

  getOCRRuntimePort(): OCRRuntimePort {
    return this.ocrRuntimePort;
  }

  getOCRProviderPort(): OCRProviderPort {
    return this.ocrProviderPort;
  }

  getDocumentClassificationRuntimePort(): DocumentClassificationRuntimePort {
    return this.documentClassificationRuntimePort;
  }

  getDocumentClassificationProviderPort(): DocumentClassificationProviderPort {
    return this.documentClassificationProviderPort;
  }

  getStorageManagerRuntimePort(): StorageManagerRuntimePort {
    return this.storageManagerRuntimePort;
  }

  getStorageProviderPort(): StorageProviderPort {
    return this.storageProviderPort;
  }

  getSearchProviderPort(): SearchProviderPort {
    return this.searchProviderPort;
  }

  getDocumentSearchRuntimePort(): DocumentSearchRuntimePort {
    return this.documentSearchRuntimePort;
  }

  getTISSProviderPort(): TISSProviderPort {
    return this.tissProviderPort;
  }

  getTISSCatalogPort(): TISSCatalogPort {
    return this.tissCatalogPort;
  }

  getRulePackEnginePort(): RulePackEnginePort {
    return this.rulePackEnginePort;
  }

  getXMLRuntimePort(): XMLRuntimePort {
    return this.xmlRuntimePort;
  }

  getXMLGenerationRuntimePort(): XMLGenerationRuntimePort {
    return this.xmlGenerationRuntimePort;
  }

  getXMLSerializerRuntimePort(): XMLSerializerRuntimePort {
    return this.xmlSerializerRuntimePort;
  }

  getXMLSchemaRuntimePort(): XMLSchemaRuntimePort {
    return this.xmlSchemaRuntimePort;
  }

  getXMLValidationRuntimePort(): XMLValidationRuntimePort {
    return this.xmlValidationRuntimePort;
  }

  getXSDRuntimePort(): XSDRuntimePort {
    return this.xsdRuntimePort;
  }

  getNamespaceRuntimePort(): NamespaceRuntimePort {
    return this.namespaceRuntimePort;
  }

  getTISSRuntimePort(): TISSRuntimePort {
    return this.tissRuntimePort;
  }

  getAIProviderPort(): AIProviderPort {
    return this.aiProviderPort;
  }

  getAIProviderRuntimePort(): AIProviderRuntimePort {
    return this.aiProviderRuntimePort;
  }

  async health(): Promise<EnterpriseRuntimeHealth> {
    const start = nowMs();
    const [
      intakeHealth,
      orchestratorHealth,
      intakeRuntimeHealth,
      captureRuntimeHealth,
      ocrRuntimeHealth,
      ocrProviderHealth,
      classificationProviderHealth,
      classificationRuntimeHealth,
      storageProviderHealth,
      storageManagerRuntimeHealth,
      searchProviderHealth,
      documentSearchRuntimeHealth,
      tissProviderHealth,
      tissCatalogHealth,
      rulePackEngineHealth,
      xmlGenerationRuntimeHealth,
      xmlRuntimeHealth,
      xmlSerializerRuntimeHealth,
      xmlSchemaRuntimeHealth,
      xmlValidationRuntimeHealth,
      xsdRuntimeHealth,
      namespaceRuntimeHealth,
      tissRuntimeHealth,
      aiProviderRuntimeHealth,
      aiProviderHealth,
    ] = await Promise.all([
      this.documentIntakePort.health(),
      this.orchestratorPort.health(),
      this.documentIntakeRuntimePort.health(),
      this.captureEngineRuntimePort.health(),
      this.ocrRuntimePort.health(),
      this.ocrProviderPort.health(),
      this.documentClassificationProviderPort.health(),
      this.documentClassificationRuntimePort.health(),
      this.storageProviderPort.health(),
      this.storageManagerRuntimePort.health(),
      this.searchProviderPort.health(),
      this.documentSearchRuntimePort.health(),
      this.tissProviderPort.health(),
      this.tissCatalogPort.health(),
      this.rulePackEnginePort.health(),
      this.xmlGenerationRuntimePort.health(),
      this.xmlRuntimePort.health(),
      this.xmlSerializerRuntimePort.health(),
      this.xmlSchemaRuntimePort.health(),
      this.xmlValidationRuntimePort.health(),
      this.xsdRuntimePort.health(),
      this.namespaceRuntimePort.health(),
      this.tissRuntimePort.health(),
      this.aiProviderRuntimePort.health(),
      this.aiProviderPort.health(),
    ]);
    const end = nowMs();
    const ok =
      intakeHealth.ok &&
      orchestratorHealth.ok &&
      intakeRuntimeHealth.ok &&
      captureRuntimeHealth.ok &&
      ocrRuntimeHealth.ok &&
      ocrProviderHealth.ok &&
      classificationProviderHealth.ok &&
      classificationRuntimeHealth.ok &&
      storageProviderHealth.ok &&
      storageManagerRuntimeHealth.ok &&
      searchProviderHealth.ok &&
      documentSearchRuntimeHealth.ok &&
      tissProviderHealth.ok &&
      tissCatalogHealth.ok &&
      rulePackEngineHealth.ok &&
      xmlGenerationRuntimeHealth.ok &&
      xmlRuntimeHealth.ok &&
      xmlSerializerRuntimeHealth.ok &&
      xmlSchemaRuntimeHealth.ok &&
      xmlValidationRuntimeHealth.ok &&
      xsdRuntimeHealth.ok &&
      namespaceRuntimeHealth.ok &&
      tissRuntimeHealth.ok &&
      aiProviderRuntimeHealth.ok &&
      aiProviderHealth.ok;
    return {
      ok,
      runtimeId: this.runtimeId,
      latencyMs: Math.max(0, Math.round(end - start)),
      documentIntakeOk: intakeHealth.ok,
      orchestratorOk: orchestratorHealth.ok,
      documentIntakeRuntimeOk: intakeRuntimeHealth.ok,
      captureEngineRuntimeOk: captureRuntimeHealth.ok,
      ocrRuntimeOk: ocrRuntimeHealth.ok,
      ocrProviderOk: ocrProviderHealth.ok,
      documentClassificationProviderOk: classificationProviderHealth.ok,
      documentClassificationRuntimeOk: classificationRuntimeHealth.ok,
      storageProviderOk: storageProviderHealth.ok,
      storageManagerRuntimeOk: storageManagerRuntimeHealth.ok,
      searchProviderOk: searchProviderHealth.ok,
      documentSearchRuntimeOk: documentSearchRuntimeHealth.ok,
      tissProviderOk: tissProviderHealth.ok,
      tissCatalogOk: tissCatalogHealth.ok,
      rulePackEngineOk: rulePackEngineHealth.ok,
      xmlGenerationRuntimeOk: xmlGenerationRuntimeHealth.ok,
      xmlRuntimeOk: xmlRuntimeHealth.ok,
      xmlSerializerRuntimeOk: xmlSerializerRuntimeHealth.ok,
      xmlSchemaRuntimeOk: xmlSchemaRuntimeHealth.ok,
      xmlValidationRuntimeOk: xmlValidationRuntimeHealth.ok,
      xsdRuntimeOk: xsdRuntimeHealth.ok,
      namespaceRuntimeOk: namespaceRuntimeHealth.ok,
      tissRuntimeOk: tissRuntimeHealth.ok,
      aiProviderRuntimeOk: aiProviderRuntimeHealth.ok,
      aiProviderOk: aiProviderHealth.ok,
      message: ok
        ? "Enterprise Runtime pronto (TISSRuntime/NamespaceRuntime/XSDRuntime/XMLValidationRuntime/XMLSchemaRuntime/XMLSerializerRuntime/XMLGenerationRuntime/XMLRuntime/RulePackEngine/TISSCatalog/TISSProvider + AIProviderRuntime + DocumentSearchRuntime/SearchProvider + StorageManagerRuntime/StorageProvider + DocumentClassificationRuntime/Provider + OCRRuntime + CaptureEngineRuntime + DocumentIntakeRuntime + Orchestrator + DocumentIntake)."
        : "Enterprise Runtime degradado — ver Ports.",
    };
  }

  /**
   * Integração ARCH-01 / DIP-01 / DIP-02 / DIP-03 / DIP-04 / DIP-05 / DIP-06:
   * Captura upload → Capture Engine Runtime → OCR Runtime → Classification Runtime
   * → Storage Manager Runtime → Document Search Runtime.
   *
   * Produto → Runtime → CaptureEngineRuntimePort
   *   → Orchestrator.startExecution → DocumentIntakeRuntime.registerIntake
   *   → DocumentIntakePort.createIntake
   *   → OCRRuntimePort.coordinateOcr (estrutural — sem OCR real)
   *   → DocumentClassificationRuntimePort.coordinateClassification (CLASS-01 Provider via classify())
   *   → StorageManagerRuntimePort.coordinateStorage → StorageProviderPort (STORAGE-01)
   *   → DocumentSearchRuntimePort.coordinateSearch → SearchProviderPort (SEARCH-01)
   */
  async registerCaptureDocumentIntake(
    input: RegisterCaptureDocumentIntakeInput,
  ): Promise<RegisterCaptureDocumentIntakeResult> {
    try {
      if (!input.sessionId || !input.documentId) {
        return {
          ok: false,
          message: "sessionId e documentId são obrigatórios.",
          code: "INVALID_INPUT",
        };
      }

      const correlationId = input.correlationId ?? undefined;
      const channel = input.channel ?? "capture-upload";

      const request: CanonicalCaptureRequest = {
        kind: "canonical-capture-request",
        identity: {
          kind: "canonical-capture-identity",
          documentId: input.documentId,
          documentKind: "capture-document",
        },
        metadata: {
          kind: "canonical-capture-metadata",
          sessionId: input.sessionId,
          tenantRef: input.tenantRef,
          correlationId,
          channel,
          tags: [
            "arch-01",
            "dip-01",
            "dip-02",
            "dip-03",
            "dip-04",
            "dip-05",
            "dip-06",
            "capture",
            channel,
          ],
          customAttributes: {
            source: "capture-upload",
            sessionId: input.sessionId,
            documentId: input.documentId,
          },
        },
        reference: {
          kind: "canonical-capture-reference",
          storageKey: input.storagePath,
          storageContainer: "clinical-documents",
          storageProvider: "product-capture",
          metadataId: input.sessionId,
          metadataNamespace: "product.capture",
        },
        capabilities: {
          kind: "canonical-capture-capabilities",
          declared: [
            "capture-upload-bridge",
            "capture-engine-runtime",
            "document-intake-runtime",
            "ocr-runtime",
            "document-classification-runtime",
            "storage-manager-runtime",
            "document-search-runtime",
          ],
        },
        configuration: {
          kind: "canonical-capture-configuration",
          sourceType: "UPLOAD",
          channel,
          priority: "NORMAL",
          notes:
            "DIP-06 bridge: capture upload registered via Capture Engine Runtime + OCR Runtime + Classification Runtime + Storage Manager Runtime + Document Search Runtime (no real processing/storage/search).",
        },
        structuralNotes:
          "DIP-06 bridge: capture upload registered via Capture Engine Runtime + OCR Runtime + Classification Runtime + Storage Manager Runtime + Document Search Runtime (no real processing/storage/search).",
      };

      const result = await this.captureEngineRuntimePort.registerCapture(request);

      if (!result.ok) {
        return {
          ok: false,
          intakeId: result.intakeId,
          executionId: result.executionId,
          runtimeSessionId: result.runtimeSessionId,
          ocrRuntimeSessionId: result.ocrRuntimeSessionId,
          ocrExecutionId: result.ocrExecutionId,
          classificationRuntimeSessionId: result.classificationRuntimeSessionId,
          classificationExecutionId: result.classificationExecutionId,
          storageManagerRuntimeSessionId: result.storageManagerRuntimeSessionId,
          storageExecutionId: result.storageExecutionId,
          documentSearchRuntimeSessionId: result.documentSearchRuntimeSessionId,
          searchExecutionId: result.searchExecutionId,
          message: result.message ?? "Capture Engine Runtime falhou.",
          code: result.code ?? "CAPTURE_RUNTIME_FAILED",
        };
      }

      // Rehidrata resultados dos Ports oficiais para compatibilidade ARCH-01 / DIP-01.
      const intake =
        result.intakeId != null
          ? await this.documentIntakePort.getIntake({ intakeId: result.intakeId })
          : undefined;
      const execution =
        result.executionId != null
          ? await this.orchestratorPort.getExecution({ executionId: result.executionId })
          : undefined;

      return {
        ok: true,
        intakeId: result.intakeId,
        executionId: result.executionId,
        runtimeSessionId: result.runtimeSessionId,
        ocrRuntimeSessionId: result.ocrRuntimeSessionId,
        ocrExecutionId: result.ocrExecutionId,
        classificationRuntimeSessionId: result.classificationRuntimeSessionId,
        classificationExecutionId: result.classificationExecutionId,
        storageManagerRuntimeSessionId: result.storageManagerRuntimeSessionId,
        storageExecutionId: result.storageExecutionId,
        documentSearchRuntimeSessionId: result.documentSearchRuntimeSessionId,
        searchExecutionId: result.searchExecutionId,
        intake: intake
          ? {
              ok: intake.ok,
              intakeId: result.intakeId!,
              intake: intake.intake,
              message: intake.message,
              code: intake.code,
            }
          : undefined,
        execution: execution,
        message:
          result.message ??
          "Capture document registered via Capture Engine Runtime + OCR Runtime + Classification Runtime + Storage Manager Runtime + Document Search Runtime (structural).",
        code: result.code,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
      };
    }
  }
}
