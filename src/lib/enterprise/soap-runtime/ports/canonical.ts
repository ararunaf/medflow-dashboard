/**
 * Modelos canônicos estruturais do Enterprise SOAP Runtime — C-03 / ECS-01.
 *
 * Foundation estrutural vendor-agnostic para encapsulamento futuro de
 * comunicação SOAP (transporte).
 *
 * Sem comunicação SOAP. Sem HTTP. Sem WSDL. Sem TLS. Sem certificado.
 * Sem autenticação. Sem MTOM. Sem XML funcional. Sem operadoras.
 * Sem banco. Sem persistência. Sem APIs. Sem filas. Sem mensageria.
 *
 * Todos os contratos abaixo são exclusivamente estruturais.
 *
 * TRANSPORT AGNOSTIC (Regra Permanente nº 5): este Runtime é o encapsulador
 * de transporte SOAP; demais Runtimes do BLOCO C NÃO conhecem SOAP.
 */

import type { XMLDocument } from "../../xml-tiss-runtime/ports/canonical";
import type { CanonicalGuide } from "../../tiss-mapping-runtime/ports/canonical";
import type { QualityAssessment } from "../../quality-runtime/ports/canonical";
import type { ValidationResult } from "../../validation-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";

export type {
  XMLDocument,
  CanonicalGuide,
  QualityAssessment,
  ValidationResult,
  AuditResult,
};

/** Status estrutural SOAP (C-03). */
export type SOAPStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "prepared"
  | "disabled"
  | "unknown"
  | (string & {});

/**
 * Envelope operacional estrutural (Regra Permanente nº 4 — Observability by Design).
 * Somente contrato — sem telemetria / tracing / logging funcional.
 */
export type SOAPRuntimeObservabilityEnvelope = {
  operationId?: string;
  correlationId?: string | null;
  startedAt?: string;
  finishedAt?: string;
  executionStatus?: SOAPStatus | (string & {});
  executionDuration?: number;
  processedItems?: number;
  warnings?: readonly string[];
  errors?: readonly string[];
  traceMetadata?: Readonly<Record<string, unknown>>;
};

/**
 * SOAPContext canônico (C-03).
 *
 * Aceita exclusivamente por contrato:
 *   XMLDocument + XMLValidationResult + CanonicalGuide +
 *   QualityAssessment + ValidationResult + AuditResult
 * — sem qualquer processamento.
 *
 * Prevê por contrato o envelope de observabilidade (RULE_04) — sem implementação.
 */
export type SOAPContext = SOAPRuntimeObservabilityEnvelope & {
  kind: "canonical-soap-context";
  contextId?: string;
  requestId?: string;
  responseId?: string;
  xmlDocument?: XMLDocument;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  structuralNotes?: string;
};

/** Header SOAP estrutural (somente contrato — soapEnvelopeImplemented: false). */
export type SOAPHeader = {
  kind: "canonical-soap-header";
  headerId?: string;
  notes?: string;
  soapEnvelopeImplemented: false;
  soapCommunicationImplemented: false;
};

/** Body SOAP estrutural (somente contrato — soapEnvelopeImplemented: false). */
export type SOAPBody = {
  kind: "canonical-soap-body";
  bodyId?: string;
  notes?: string;
  soapEnvelopeImplemented: false;
  soapCommunicationImplemented: false;
  xmlFunctionalImplemented: false;
};

/** Fault SOAP estrutural (somente contrato — soapFaultImplemented: false). */
export type SOAPFault = {
  kind: "canonical-soap-fault";
  faultId?: string;
  code?: string;
  message?: string;
  notes?: string;
  soapFaultImplemented: false;
  soapCommunicationImplemented: false;
};

/** Envelope SOAP estrutural (somente contrato — soapEnvelopeImplemented: false). */
export type SOAPEnvelope = {
  kind: "canonical-soap-envelope";
  envelopeId?: string;
  header?: SOAPHeader;
  body?: SOAPBody;
  fault?: SOAPFault;
  notes?: string;
  soapEnvelopeImplemented: false;
  soapFaultImplemented: false;
  soapCommunicationImplemented: false;
  mtomImplemented: false;
};

/**
 * Pedido canônico SOAP (C-03).
 * Não contém HTTP. Não contém WSDL. Não contém payload SOAP real.
 * Não conhece operadora/contrato/tenant.
 */
export type SOAPRequest = {
  kind: "canonical-soap-request";
  requestId?: string;
  name?: string;
  operation?: string;
  envelope?: SOAPEnvelope;
  soapContext?: SOAPContext;
  xmlDocument?: XMLDocument;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  structuralNotes?: string;
  soapCommunicationImplemented: false;
  wsdlImplemented: false;
  soapEnvelopeImplemented: false;
  soapFaultImplemented: false;
  certificateImplemented: false;
  tlsImplemented: false;
  mtomImplemented: false;
  compressionImplemented: false;
  retryImplemented: false;
  operatorCommunicationImplemented: false;
};

/**
 * Resposta canônica SOAP (C-03).
 * Contém apenas referência/estrutura canônica — nunca comunicação SOAP real.
 */
export type SOAPResponse = {
  kind: "canonical-soap-response";
  ok: boolean;
  responseId: string;
  request: SOAPRequest;
  envelope?: SOAPEnvelope;
  soapContext?: SOAPContext;
  xmlDocument?: XMLDocument;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  /** Sempre false — nenhuma comunicação SOAP executada nesta fundação. */
  communicationExecuted: false;
  /** Sempre false — nenhuma chamada HTTP/SOAP realizada. */
  realCommunicationPerformed: false;
  /** Sempre false — nenhum WSDL carregado. */
  wsdlLoaded: false;
  /** Sempre false — nenhum certificado digital usado. */
  certificateUsed: false;
  /** Sempre false — nenhum TLS estabelecido. */
  tlsEstablished: false;
  /** Sempre true — runtime estrutural pronto (C-03). */
  runtimeReady: true;
  soapCommunicationImplemented: false;
  wsdlImplemented: false;
  soapEnvelopeImplemented: false;
  soapFaultImplemented: false;
  certificateImplemented: false;
  tlsImplemented: false;
  mtomImplemented: false;
  compressionImplemented: false;
  retryImplemented: false;
  operatorCommunicationImplemented: false;
  status: SOAPStatus;
  message?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do SOAP Runtime (in-process). */
export type SOAPStatistics = {
  kind: "canonical-soap-statistics";
  totalResponses: number;
  completedResponses: number;
  failedResponses: number;
  cancelledResponses: number;
  preparedResponses: number;
  totalRequests: number;
  totalContexts: number;
  communicationExecutedCount: 0;
  realCommunicationPerformedCount: 0;
  wsdlLoadedCount: 0;
  certificateUsedCount: 0;
  tlsEstablishedCount: 0;
  soapCommunicationImplementedCount: 0;
  wsdlImplementedCount: 0;
  soapEnvelopeImplementedCount: 0;
  soapFaultImplementedCount: 0;
  certificateImplementedCount: 0;
  tlsImplementedCount: 0;
  mtomImplementedCount: 0;
  compressionImplementedCount: 0;
  retryImplementedCount: 0;
  operatorCommunicationImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor SOAP Runtime. */
export type SOAPHealth = {
  kind: "canonical-soap-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedResponseCount?: number;
  storedRequestCount?: number;
  storedContextCount?: number;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  qualityRuntimeOk?: boolean;
  autoFillRuntimeOk?: boolean;
  tissMappingRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  runtimeReady: true;
  soapCommunicationImplemented: false;
  wsdlImplemented: false;
  soapEnvelopeImplemented: false;
  soapFaultImplemented: false;
  certificateImplemented: false;
  tlsImplemented: false;
  mtomImplemented: false;
  compressionImplemented: false;
  retryImplemented: false;
  operatorCommunicationImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor SOAP Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type SOAPCapabilities = {
  kind: "canonical-soap-capabilities";
  supportsPrepare: boolean;
  supportsGetResponse: boolean;
  supportsListResponses: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalSOAP: boolean;
  runtimeReady: true;
  soapCommunicationImplemented: false;
  wsdlImplemented: false;
  soapEnvelopeImplemented: false;
  soapFaultImplemented: false;
  certificateImplemented: false;
  tlsImplemented: false;
  mtomImplemented: false;
  compressionImplemented: false;
  retryImplemented: false;
  operatorCommunicationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsHttpEndpoint: false;
  knowsWsdl: false;
};

/** Helper estrutural — cria envelope SOAP desabilitado. */
export function createDisabledSOAPEnvelope(): SOAPEnvelope {
  return {
    kind: "canonical-soap-envelope",
    envelopeId: "disabled-envelope",
    header: {
      kind: "canonical-soap-header",
      headerId: "disabled-header",
      notes: "Structural SOAP header contract (no real SOAP)",
      soapEnvelopeImplemented: false,
      soapCommunicationImplemented: false,
    },
    body: {
      kind: "canonical-soap-body",
      bodyId: "disabled-body",
      notes: "Structural SOAP body contract (no XML functional)",
      soapEnvelopeImplemented: false,
      soapCommunicationImplemented: false,
      xmlFunctionalImplemented: false,
    },
    notes: "Structural SOAP envelope contract (no real SOAP communication)",
    soapEnvelopeImplemented: false,
    soapFaultImplemented: false,
    soapCommunicationImplemented: false,
    mtomImplemented: false,
  };
}

/** Helper estrutural — cria fault SOAP desabilitado. */
export function createDisabledSOAPFault(): SOAPFault {
  return {
    kind: "canonical-soap-fault",
    faultId: "disabled-fault",
    notes: "Structural SOAP fault contract (no real SOAP fault handling)",
    soapFaultImplemented: false,
    soapCommunicationImplemented: false,
  };
}
