/**
 * HealthcareRelationship — representação estrutural (EPC-19 / FASE 8).
 *
 * Exemplos estruturais (sem implementação de grafo / traversal):
 *   Patient → Attendance → Procedure → Authorization → Audit → Payment
 *
 * Somente representação. Sem lógica. Sem motor de relacionamento.
 */
import type {
  HealthcareConfigurationReference,
  HealthcareEntityKind,
  HealthcareEntityStatus,
  HealthcareMetadataReference,
  HealthcareTag,
} from "./models";

/**
 * Relacionamento canônico entre entidades do Healthcare Model.
 * Estrutural apenas — não executa joins, validação ou workflow.
 */
export type HealthcareRelationship = {
  id: string;
  version?: string;
  status?: HealthcareEntityStatus;
  metadataReference?: HealthcareMetadataReference;
  configurationReference?: HealthcareConfigurationReference;
  tags?: readonly HealthcareTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
  createdAt?: string;
  updatedAt?: string;

  /** Kind da entidade origem. */
  sourceKind: HealthcareEntityKind;
  /** Id da entidade origem. */
  sourceId: string;
  /** Kind da entidade destino. */
  targetKind: HealthcareEntityKind;
  /** Id da entidade destino. */
  targetId: string;
  /**
   * Tipo estrutural livre do relacionamento
   * (ex.: "patient-attendance", "attendance-procedure").
   */
  relationshipType?: string;
  description?: string;
};

/**
 * Cadeia estrutural de exemplo documentada (não executável).
 * Serve como referência de modelagem — sem runtime.
 */
export const HEALTHCARE_RELATIONSHIP_CHAIN_EXAMPLE = [
  "patient",
  "attendance",
  "procedure",
  "authorization",
  "audit",
  "payment",
] as const satisfies readonly HealthcareEntityKind[];
