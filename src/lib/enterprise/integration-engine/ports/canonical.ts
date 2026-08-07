/**
 * Contratos canônicos do Bloco F — Enterprise Integration Engine.
 *
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Convênios. Sem contratos.
 * Sem clínicas. Sem tenants. Sem XML. Sem JSON. Sem REST. Sem banco.
 */

export interface CanonicalIntegration {
  readonly kind: "canonical-integration";
  readonly integrationId: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationConnector {
  readonly kind: "canonical-integration-connector";
  readonly connectorId: string;
  readonly integrationId: string;
  readonly name: string;
  readonly description?: string;
  readonly configuration?: Record<string, unknown>;
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationRegistryResult {
  readonly kind: "canonical-integration-registry-result";
  readonly ok: boolean;
  readonly integrationId?: string;
  readonly code: string;
  readonly message: string;
  readonly integration?: CanonicalIntegration | null;
}

export interface CanonicalIntegrationConnectorResult {
  readonly kind: "canonical-integration-connector-result";
  readonly ok: boolean;
  readonly connectorId?: string;
  readonly code: string;
  readonly message: string;
  readonly connector?: CanonicalIntegrationConnector | null;
}

export interface CanonicalIntegrationRegistryStats {
  readonly totalIntegrations: number;
  readonly integrationIds: readonly string[];
  readonly categories: readonly string[];
  readonly tags: readonly string[];
}

export interface CanonicalIntegrationConnectorStats {
  readonly totalConnectors: number;
  readonly connectorIds: readonly string[];
  readonly integrationIds: readonly string[];
  readonly tags: readonly string[];
}

export interface CanonicalIntegrationPipelineStage {
  readonly kind: "canonical-integration-pipeline-stage";
  readonly stageId: string;
  readonly connectorId: string;
  readonly name: string;
  readonly description?: string;
  readonly order: number;
}

export interface CanonicalIntegrationPipeline {
  readonly kind: "canonical-integration-pipeline";
  readonly pipelineId: string;
  readonly integrationId: string;
  readonly name: string;
  readonly description?: string;
  readonly stages: readonly CanonicalIntegrationPipelineStage[];
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationPipelineResult {
  readonly kind: "canonical-integration-pipeline-result";
  readonly ok: boolean;
  readonly pipelineId?: string;
  readonly code: string;
  readonly message: string;
  readonly pipeline?: CanonicalIntegrationPipeline | null;
}

export interface CanonicalIntegrationPipelineStats {
  readonly totalPipelines: number;
  readonly pipelineIds: readonly string[];
  readonly integrationIds: readonly string[];
  readonly tags: readonly string[];
}

export interface CanonicalIntegrationMappingRule {
  readonly kind: "canonical-integration-mapping-rule";
  readonly ruleId: string;
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly required?: boolean;
  readonly description?: string;
}

export interface CanonicalIntegrationMapping {
  readonly kind: "canonical-integration-mapping";
  readonly mappingId: string;
  readonly integrationId: string;
  readonly connectorId: string;
  readonly pipelineId: string;
  readonly name: string;
  readonly description?: string;
  readonly rules: readonly CanonicalIntegrationMappingRule[];
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationMappingResult {
  readonly kind: "canonical-integration-mapping-result";
  readonly ok: boolean;
  readonly mappingId?: string;
  readonly code: string;
  readonly message: string;
  readonly mapping?: CanonicalIntegrationMapping | null;
}

export interface CanonicalIntegrationMappingStats {
  readonly totalMappings: number;
  readonly mappingIds: readonly string[];
  readonly integrationIds: readonly string[];
  readonly connectorIds: readonly string[];
  readonly pipelineIds: readonly string[];
  readonly tags: readonly string[];
}

export type CanonicalIntegrationTransformationStepKind =
  | "trim"
  | "uppercase"
  | "lowercase"
  | "concat"
  | "split"
  | "replace"
  | "substring"
  | "normalize"
  | "cast"
  | "date-format"
  | "number-format"
  | "boolean"
  | "default";

export interface CanonicalIntegrationTransformationStep {
  readonly kind: "canonical-integration-transformation-step";
  readonly stepId: string;
  readonly type: CanonicalIntegrationTransformationStepKind;
  readonly params?: Record<string, unknown>;
}

export interface CanonicalIntegrationTransformation {
  readonly kind: "canonical-integration-transformation";
  readonly transformationId: string;
  readonly mappingId: string;
  readonly integrationId: string;
  readonly connectorId: string;
  readonly pipelineId: string;
  readonly name: string;
  readonly steps: readonly CanonicalIntegrationTransformationStep[];
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationTransformationResult {
  readonly kind: "canonical-integration-transformation-result";
  readonly ok: boolean;
  readonly transformationId?: string;
  readonly code: string;
  readonly message: string;
  readonly transformation?: CanonicalIntegrationTransformation | null;
}

export interface CanonicalIntegrationTransformationStats {
  readonly totalTransformations: number;
  readonly transformationIds: readonly string[];
  readonly mappingIds: readonly string[];
  readonly integrationIds: readonly string[];
  readonly connectorIds: readonly string[];
  readonly pipelineIds: readonly string[];
  readonly tags: readonly string[];
}

export interface CanonicalIntegrationValidation {
  readonly kind: "canonical-integration-validation";
  readonly validationId: string;
  readonly integrationId: string;
  readonly connectorId: string;
  readonly pipelineId: string;
  readonly mappingId: string;
  readonly transformationId: string;
  readonly name: string;
  readonly rules: readonly string[];
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationValidationResult {
  readonly kind: "canonical-integration-validation-result";
  readonly ok: boolean;
  readonly validationId?: string;
  readonly code: string;
  readonly message: string;
  readonly validation?: CanonicalIntegrationValidation | null;
}

export interface CanonicalIntegrationValidationStats {
  readonly totalValidations: number;
  readonly validationIds: readonly string[];
  readonly integrationIds: readonly string[];
  readonly connectorIds: readonly string[];
  readonly pipelineIds: readonly string[];
  readonly mappingIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly tags: readonly string[];
}

export interface CanonicalIntegrationRouting {
  readonly kind: "canonical-integration-routing";
  readonly routeId: string;
  readonly integrationId: string;
  readonly connectorId: string;
  readonly pipelineId: string;
  readonly mappingId: string;
  readonly transformationId: string;
  readonly validationId: string;
  readonly name: string;
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationRoutingResult {
  readonly kind: "canonical-integration-routing-result";
  readonly ok: boolean;
  readonly routeId?: string;
  readonly code: string;
  readonly message: string;
  readonly route?: CanonicalIntegrationRouting | null;
}

export interface CanonicalIntegrationRoutingStats {
  readonly totalRoutes: number;
  readonly routeIds: readonly string[];
  readonly integrationIds: readonly string[];
  readonly connectorIds: readonly string[];
  readonly pipelineIds: readonly string[];
  readonly mappingIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly validationIds: readonly string[];
  readonly tags: readonly string[];
}

export interface CanonicalIntegrationMonitoring {
  readonly kind: "canonical-integration-monitoring";
  readonly monitoringId: string;
  readonly integrationId: string;
  readonly routeId: string;
  readonly connectorId: string;
  readonly pipelineId: string;
  readonly mappingId: string;
  readonly transformationId: string;
  readonly validationId: string;
  readonly name: string;
  readonly metrics?: readonly CanonicalIntegrationMetric[];
  readonly events?: readonly CanonicalIntegrationMonitoringEvent[];
  readonly status?: "healthy" | "degraded" | "unhealthy";
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationMetric {
  readonly kind: "canonical-integration-metric";
  readonly metricId: string;
  readonly name: string;
  readonly value: number;
  readonly unit?: string;
  readonly timestamp?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationMonitoringEvent {
  readonly kind: "canonical-integration-monitoring-event";
  readonly eventId: string;
  readonly type: string;
  readonly description?: string;
  readonly timestamp: number;
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationMonitoringResult {
  readonly kind: "canonical-integration-monitoring-result";
  readonly ok: boolean;
  readonly monitoringId?: string;
  readonly code: string;
  readonly message: string;
  readonly monitoring?: CanonicalIntegrationMonitoring | null;
}

export interface CanonicalIntegrationMonitoringStats {
  readonly totalMonitorings: number;
  readonly monitoringIds: readonly string[];
  readonly integrationIds: readonly string[];
  readonly routeIds: readonly string[];
  readonly connectorIds: readonly string[];
  readonly pipelineIds: readonly string[];
  readonly mappingIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly validationIds: readonly string[];
  readonly totalMetrics: number;
  readonly totalEvents: number;
  readonly statusCounts: { healthy: number; degraded: number; unhealthy: number };
  readonly tags: readonly string[];
}

export interface CanonicalIntegrationReport {
  readonly kind: "canonical-integration-report";
  readonly reportId: string;
  readonly integrationId: string;
  readonly monitoringId: string;
  readonly name: string;
  readonly summary?: string;
  readonly sections?: readonly CanonicalIntegrationReportSection[];
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalIntegrationReportSection {
  readonly kind: "canonical-integration-report-section";
  readonly sectionId: string;
  readonly title: string;
  readonly content?: Record<string, unknown>;
  readonly metrics?: readonly CanonicalIntegrationMetric[];
}

export interface CanonicalIntegrationReportResult {
  readonly kind: "canonical-integration-report-result";
  readonly ok: boolean;
  readonly reportId?: string;
  readonly code: string;
  readonly message: string;
  readonly report?: CanonicalIntegrationReport | null;
}

export interface CanonicalIntegrationReportStats {
  readonly totalReports: number;
  readonly reportIds: readonly string[];
  readonly integrationIds: readonly string[];
  readonly monitoringIds: readonly string[];
  readonly totalSections: number;
  readonly tags: readonly string[];
}

export interface CanonicalIntegrationEngineHealth {
  readonly ok: boolean;
  readonly integrationEngineOk: boolean;
  readonly integrationRegistryOk: boolean;
  readonly integrationConnectorOk: boolean;
  readonly integrationPipelineOk: boolean;
  readonly integrationMappingOk: boolean;
  readonly integrationTransformationOk: boolean;
  readonly integrationValidationOk: boolean;
  readonly integrationRoutingOk: boolean;
  readonly integrationMonitoringOk: boolean;
  readonly integrationReportOk: boolean;
}
