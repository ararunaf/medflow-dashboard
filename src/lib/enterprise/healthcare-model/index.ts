/**
 * Enterprise Canonical Healthcare Model Foundation — Ports & Adapters (EPC-19).
 *
 * Fluxo oficial:
 *   Application → HealthcareModelPort → HealthcareModelAdapter
 *     → HealthcareModelStore → HealthcareModelFactory → HealthcareModelProvider
 *
 * Linguagem canônica do MedicFlow Enterprise.
 * Qualquer padrão futuro (TISS, HL7 FHIR, DICOM, XML proprietário)
 * deverá ser convertido PARA este modelo antes de alimentar
 * Rule Engine, Workflow ou AI Auditor.
 *
 * EPC-19: fundação estrutural apenas.
 * NÃO implementa TISS, TUSS, CID, ANS, operadoras, cooperativas,
 * OCR, IA, Workflow, Rule Engine, APIs, banco, UI ou migrations.
 */
export type {
  CreateHealthcareEntityInput,
  CreateHealthcareEntityResult,
  GetHealthcareEntityInput,
  GetHealthcareEntityResult,
  HealthcareAttachment,
  HealthcareAttendance,
  HealthcareAudit,
  HealthcareAuthorization,
  HealthcareBeneficiary,
  HealthcareClaim,
  HealthcareConfigurationReference,
  HealthcareDiagnosis,
  HealthcareDocument,
  HealthcareEntity,
  HealthcareEntityBase,
  HealthcareEntityKind,
  HealthcareEntityStatus,
  HealthcareEpisode,
  HealthcareEvidence,
  HealthcareMetadataReference,
  HealthcareModelCapabilities,
  HealthcareModelHealth,
  HealthcareModelPort,
  HealthcareModelProviderId,
  HealthcareModelProviderOptions,
  HealthcareOrganization,
  HealthcarePatient,
  HealthcarePayment,
  HealthcareProcedure,
  HealthcareProfessional,
  HealthcareReference,
  HealthcareRelationship,
  HealthcareTag,
  ListHealthcareEntitiesInput,
  ListHealthcareEntitiesResult,
} from "./ports";

export {
  HEALTHCARE_ENTITY_KINDS,
  HEALTHCARE_RELATIONSHIP_CHAIN_EXAMPLE,
  createHealthcareEntityId,
  createHealthcareRelationshipId,
  resetHealthcareEntityIdSequence,
  resetHealthcareRelationshipIdSequence,
} from "./ports";

export {
  DEFAULT_HEALTHCARE_MODEL_ADAPTER_ID,
  DEFAULT_HEALTHCARE_MODEL_VERSION,
  DefaultHealthcareModelAdapter,
  MOCK_HEALTHCARE_MODEL_ADAPTER_ID,
  MOCK_HEALTHCARE_MODEL_VERSION,
  MockHealthcareModelAdapter,
  type DefaultHealthcareModelRuntime,
  type MockHealthcareModelAdapterOptions,
} from "./adapters";

export {
  DEFAULT_HEALTHCARE_MODEL_STORE_ID,
  DefaultHealthcareModelStore,
  type DefaultHealthcareModelStoreOptions,
  type HealthcareModelStore,
  type StoredHealthcareEntity,
  type StoredHealthcareRelationship,
} from "./store";

export {
  HealthcareModelFactory,
  createHealthcareModelFactory,
  type HealthcareModelFactoryOptions,
} from "./factory";

export { createHealthcareModelPort } from "./providers";

export { getHealthcareModelHealthSummary, type HealthcareModelHealthSummary } from "./demo";
