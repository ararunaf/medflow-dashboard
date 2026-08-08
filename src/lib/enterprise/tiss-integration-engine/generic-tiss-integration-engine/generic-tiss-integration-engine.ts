/**
 * GenericTissIntegrationEngine — H-10.
 *
 * Fachada pura que agrega as engines H-01 a H-09 do Bloco H.
 * Não contém lógica de negócio, validação, processamento, retry, auditoria,
 * comunicação, SOAP, autenticação, submissão, batch, processamento de retorno
 * ou rastreamento de status.
 */
import type { TISSIntegrationCapabilities } from "../ports/capabilities";
import { H10_TISS_INTEGRATION_CAPABILITIES } from "../ports/capabilities";
import { TissCommunicationEngine } from "../communication";
import { TissSoapEngine } from "../soap";
import { TissAuthenticationEngine } from "../authentication";
import { TissSubmissionEngine } from "../submission";
import { TissBatchEngine } from "../batch";
import { TissReturnProcessingEngine } from "../return-processing";
import { TissStatusTrackingEngine } from "../status-tracking";
import { TissRetryEngine } from "../retry";
import { TissAuditEngine } from "../audit";

export class GenericTissIntegrationEngine {
  readonly communication: TissCommunicationEngine;
  readonly soap: TissSoapEngine;
  readonly authentication: TissAuthenticationEngine;
  readonly submission: TissSubmissionEngine;
  readonly batch: TissBatchEngine;
  readonly returnProcessing: TissReturnProcessingEngine;
  readonly statusTracking: TissStatusTrackingEngine;
  readonly retry: TissRetryEngine;
  readonly audit: TissAuditEngine;

  constructor(
    communication: TissCommunicationEngine = new TissCommunicationEngine(),
    soap: TissSoapEngine = new TissSoapEngine(communication),
    authentication: TissAuthenticationEngine = new TissAuthenticationEngine(communication, soap),
    submission: TissSubmissionEngine = new TissSubmissionEngine(
      communication,
      soap,
      authentication,
    ),
    batch: TissBatchEngine = new TissBatchEngine(submission),
    returnProcessing: TissReturnProcessingEngine = new TissReturnProcessingEngine(
      submission,
      batch,
    ),
    statusTracking: TissStatusTrackingEngine = new TissStatusTrackingEngine(
      submission,
      batch,
      returnProcessing,
    ),
    retry: TissRetryEngine = new TissRetryEngine(submission, batch, returnProcessing),
    audit: TissAuditEngine = new TissAuditEngine(submission, batch, returnProcessing),
  ) {
    this.communication = communication;
    this.soap = soap;
    this.authentication = authentication;
    this.submission = submission;
    this.batch = batch;
    this.returnProcessing = returnProcessing;
    this.statusTracking = statusTracking;
    this.retry = retry;
    this.audit = audit;
  }

  getCapabilities(): TISSIntegrationCapabilities {
    return H10_TISS_INTEGRATION_CAPABILITIES;
  }
}
