/**
 * TissSubmissionEngine — H-04.
 *
 * Catálogo de submissões TISS.
 * Reutiliza TissCommunicationEngine (H-01), TissSoapEngine (H-02) e TissAuthenticationEngine (H-03).
 * Não envia, não processa retornos, lotes, status, retry ou auditoria.
 */
import {
  H04_TISS_INTEGRATION_CAPABILITIES,
  type TISSIntegrationCapabilities,
} from "../ports/capabilities";
import { TissCommunicationEngine } from "../communication";
import { TissSoapEngine } from "../soap";
import { TissAuthenticationEngine } from "../authentication";

export interface TissSubmission {
  readonly kind: "tiss-submission";
  readonly submissionId: string;
  readonly channelId: string;
  readonly endpointId: string;
  readonly credentialId: string;
  readonly name: string;
  readonly submissionType: "individual" | "batch";
  readonly metadata?: Record<string, unknown>;
}

export interface TissSubmissionResult {
  readonly ok: boolean;
  readonly submissionId?: string;
  readonly code: string;
  readonly message: string;
  readonly submission?: TissSubmission | null;
}

export interface TissSubmissionStats {
  readonly totalSubmissions: number;
  readonly submissionIds: readonly string[];
  readonly channelIds: readonly string[];
  readonly endpointIds: readonly string[];
  readonly credentialIds: readonly string[];
  readonly submissionTypes: readonly string[];
}

export class TissSubmissionEngine {
  private readonly communication: TissCommunicationEngine;
  private readonly soap: TissSoapEngine;
  private readonly authentication: TissAuthenticationEngine;
  private readonly submissions = new Map<string, TissSubmission>();

  constructor(
    communication: TissCommunicationEngine = new TissCommunicationEngine(),
    soap: TissSoapEngine = new TissSoapEngine(communication),
    authentication: TissAuthenticationEngine = new TissAuthenticationEngine(communication, soap),
  ) {
    this.communication = communication;
    this.soap = soap;
    this.authentication = authentication;
  }

  getCapabilities(): TISSIntegrationCapabilities {
    return H04_TISS_INTEGRATION_CAPABILITIES;
  }

  registerSubmission(submission: TissSubmission): TissSubmissionResult {
    if (!submission.submissionId || submission.submissionId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SUBMISSION_INVALID_SUBMISSION_ID",
        message: "submissionId is required",
      };
    }
    if (!submission.channelId || submission.channelId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SUBMISSION_INVALID_CHANNEL_ID",
        message: "channelId is required",
      };
    }
    if (!submission.endpointId || submission.endpointId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SUBMISSION_INVALID_ENDPOINT_ID",
        message: "endpointId is required",
      };
    }
    if (!submission.credentialId || submission.credentialId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SUBMISSION_INVALID_CREDENTIAL_ID",
        message: "credentialId is required",
      };
    }
    if (!submission.name || submission.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_SUBMISSION_INVALID_NAME",
        message: "name is required",
      };
    }

    const channel = this.communication.findChannel(submission.channelId);
    if (!channel) {
      return {
        ok: false,
        code: "TISS_SUBMISSION_CHANNEL_NOT_FOUND",
        message: `channel ${submission.channelId} not found`,
      };
    }

    const endpoint = this.soap.findSoapEndpoint(submission.endpointId);
    if (!endpoint) {
      return {
        ok: false,
        code: "TISS_SUBMISSION_ENDPOINT_NOT_FOUND",
        message: `endpoint ${submission.endpointId} not found`,
      };
    }

    const credential = this.authentication.findCredential(submission.credentialId);
    if (!credential) {
      return {
        ok: false,
        code: "TISS_SUBMISSION_CREDENTIAL_NOT_FOUND",
        message: `credential ${submission.credentialId} not found`,
      };
    }

    this.submissions.set(submission.submissionId, submission);

    return {
      ok: true,
      submissionId: submission.submissionId,
      code: "TISS_SUBMISSION_REGISTERED",
      message: "submission registered",
      submission,
    };
  }

  findSubmission(submissionId: string): TissSubmission | undefined {
    return this.submissions.get(submissionId);
  }

  listSubmissions(channelId?: string): TissSubmission[] {
    const all = Array.from(this.submissions.values());
    if (!channelId) return all;
    return all.filter((s) => s.channelId === channelId);
  }

  stats(): TissSubmissionStats {
    const all = this.listSubmissions();
    const channelIds = new Set<string>();
    const endpointIds = new Set<string>();
    const credentialIds = new Set<string>();
    const submissionTypes = new Set<string>();
    for (const s of all) {
      channelIds.add(s.channelId);
      endpointIds.add(s.endpointId);
      credentialIds.add(s.credentialId);
      submissionTypes.add(s.submissionType);
    }
    return {
      totalSubmissions: all.length,
      submissionIds: all.map((s) => s.submissionId),
      channelIds: Array.from(channelIds),
      endpointIds: Array.from(endpointIds),
      credentialIds: Array.from(credentialIds),
      submissionTypes: Array.from(submissionTypes),
    };
  }
}
