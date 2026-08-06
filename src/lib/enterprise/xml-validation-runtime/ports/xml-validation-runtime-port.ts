/**
 * XMLValidationRuntimePort — contrato único do Enterprise XML Validation Runtime (C-02 / D-02).
 *
 * Application / Enterprise Runtime / TISS Runtime dependem exclusivamente desta
 * interface para orquestração estrutural de validação futura de XML + capability
 * funcional XSD Validation (D-02).
 *
 * Fluxo estrutural (C-02):
 *   Produto → Enterprise Runtime → XMLValidationRuntimePort
 *     → Adapter → InMemoryXMLValidationRuntimeStore → XMLValidationResult
 *
 * Fluxo funcional D-02:
 *   CanonicalXMLDocument + XSD → validateXsd() → CanonicalXSDValidationResult
 *
 * C-02: infraestrutura canônica estrutural.
 * D-02: XSD Validation funcional (única capability). Sem XPath / Transformation /
 * SOAP / TISS / Operadoras / Auto Repair / Workflow / Persistência.
 */
import type {
  CorrectXMLInput,
  CorrectXMLResult,
  GetXMLValidationResultInput,
  GetXMLValidationResultResult,
  ListXMLValidationResultsInput,
  ListXMLValidationResultsResult,
  RepairXMLInput,
  RepairXMLResult,
  ValidateBusinessInput,
  ValidateBusinessResult,
  ValidateNamespaceInput,
  ValidateNamespaceResult,
  ValidateOperatorInput,
  ValidateOperatorResult,
  ValidateVersionInput,
  ValidateVersionResult,
  ValidateXMLInput,
  ValidateXMLResult,
  ValidateXSDInput,
  ValidateXSDResult,
  XMLValidationRuntimeCapabilities,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimeProviderId,
  XMLValidationStatsInput,
  XMLValidationStatsResult,
} from "./types";

export interface XMLValidationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: XMLValidationRuntimeProviderId;

  // -------------------------------------------------------------------------
  // C-02 — operações estruturais canônicas.
  // -------------------------------------------------------------------------

  /**
   * Executa operação estrutural de validação canônica (C-02).
   * Não carrega XSD oficial ANS/TISS. Não produz XML TISS/ANS.
   */
  validate(input: ValidateXMLInput): Promise<ValidateXMLResult>;

  /** Obtém resultado estrutural por resultId. */
  getResult(input: GetXMLValidationResultInput): Promise<GetXMLValidationResultResult>;

  /** Lista resultados estruturais do store in-memory. */
  listResults(input?: ListXMLValidationResultsInput): Promise<ListXMLValidationResultsResult>;

  /** Estatísticas estruturais do store in-memory (C-02). */
  stats(input?: XMLValidationStatsInput): Promise<XMLValidationStatsResult>;

  // -------------------------------------------------------------------------
  // D-02 — XSD Validation funcional.
  // -------------------------------------------------------------------------

  /**
   * Valida CanonicalXMLDocument contra XSD.
   * Capability D-02 (`xsdValidationImplemented = true`).
   */
  validateXsd(input: ValidateXSDInput): Promise<ValidateXSDResult>;

  // -------------------------------------------------------------------------
  // D-04 — Namespace Validation funcional.
  // -------------------------------------------------------------------------

  /**
   * Valida namespace de CanonicalXMLDocument.
   * Capability D-04 (`namespaceValidationImplemented = true`).
   */
  validateNamespace(input: ValidateNamespaceInput): Promise<ValidateNamespaceResult>;

  // -------------------------------------------------------------------------
  // D-05 — Version Validation funcional.
  // -------------------------------------------------------------------------

  /**
   * Valida versão em CanonicalXMLDocument.
   * Capability D-05 (`versionValidationImplemented = true`).
   */
  validateVersion(input: ValidateVersionInput): Promise<ValidateVersionResult>;

  // -------------------------------------------------------------------------
  // D-06 — Business Validation funcional.
  // -------------------------------------------------------------------------

  /**
   * Valida regras de negócio sobre CanonicalXMLDocument.
   * Capability D-06 (`businessValidationImplemented = true`).
   */
  validateBusiness(input: ValidateBusinessInput): Promise<ValidateBusinessResult>;

  // -------------------------------------------------------------------------
  // D-07 — Operator Validation funcional.
  // -------------------------------------------------------------------------

  /**
   * Valida identificador de operador em CanonicalXMLDocument.
   * Capability D-07 (`operatorValidationImplemented = true`).
   */
  validateOperator(input: ValidateOperatorInput): Promise<ValidateOperatorResult>;

  // -------------------------------------------------------------------------
  // D-08 — XML Repair funcional.
  // -------------------------------------------------------------------------

  /**
   * Aplica reparos genéricos em CanonicalXMLDocument.
   * Capability D-08 (`xmlRepairImplemented = true`).
   */
  repairXML(input: RepairXMLInput): Promise<RepairXMLResult>;

  // -------------------------------------------------------------------------
  // D-09 — Automatic Correction funcional.
  // -------------------------------------------------------------------------

  /**
   * Aplica correções automáticas genéricas em CanonicalXMLDocument.
   * Capability D-09 (`automaticCorrectionImplemented = true`).
   */
  correctXML(input: CorrectXMLInput): Promise<CorrectXMLResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<XMLValidationRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): XMLValidationRuntimeCapabilities;

  /** Metadados agregados do provedor (C-02 / D-02). */
  providerInfo(): XMLValidationRuntimeInfo;
}
