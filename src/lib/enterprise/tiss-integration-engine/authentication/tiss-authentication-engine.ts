/**
 * TissAuthenticationEngine — H-03.
 *
 * Catálogo de credenciais de autenticação TISS.
 * Reutiliza TissCommunicationEngine (H-01) e TissSoapEngine (H-02).
 * Não envia, não autentica realmente, não processa retornos, lotes, retry ou auditoria.
 */
import {
  H03_TISS_INTEGRATION_CAPABILITIES,
  type TISSIntegrationCapabilities,
} from "../ports/capabilities";
import { TissCommunicationEngine } from "../communication";
import { TissSoapEngine } from "../soap";

export interface TissAuthenticationCredential {
  readonly kind: "tiss-authentication-credential";
  readonly credentialId: string;
  readonly channelId: string;
  readonly endpointId?: string;
  readonly name: string;
  readonly credentialType: "username-password" | "token" | "certificate";
  readonly metadata?: Record<string, unknown>;
}

export interface TissAuthenticationCredentialResult {
  readonly ok: boolean;
  readonly credentialId?: string;
  readonly code: string;
  readonly message: string;
  readonly credential?: TissAuthenticationCredential | null;
}

export interface TissAuthenticationCredentialStats {
  readonly totalCredentials: number;
  readonly credentialIds: readonly string[];
  readonly channelIds: readonly string[];
  readonly endpointIds: readonly string[];
  readonly credentialTypes: readonly string[];
}

export class TissAuthenticationEngine {
  private readonly communication: TissCommunicationEngine;
  private readonly soap: TissSoapEngine;
  private readonly credentials = new Map<string, TissAuthenticationCredential>();

  constructor(
    communication: TissCommunicationEngine = new TissCommunicationEngine(),
    soap: TissSoapEngine = new TissSoapEngine(communication),
  ) {
    this.communication = communication;
    this.soap = soap;
  }

  getCapabilities(): TISSIntegrationCapabilities {
    return H03_TISS_INTEGRATION_CAPABILITIES;
  }

  registerCredential(credential: TissAuthenticationCredential): TissAuthenticationCredentialResult {
    if (!credential.credentialId || credential.credentialId.trim() === "") {
      return {
        ok: false,
        code: "TISS_AUTH_INVALID_CREDENTIAL_ID",
        message: "credentialId is required",
      };
    }
    if (!credential.channelId || credential.channelId.trim() === "") {
      return {
        ok: false,
        code: "TISS_AUTH_INVALID_CHANNEL_ID",
        message: "channelId is required",
      };
    }
    if (!credential.name || credential.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_AUTH_INVALID_NAME",
        message: "name is required",
      };
    }

    const channel = this.communication.findChannel(credential.channelId);
    if (!channel) {
      return {
        ok: false,
        code: "TISS_AUTH_CHANNEL_NOT_FOUND",
        message: `channel ${credential.channelId} not found`,
      };
    }

    if (credential.endpointId && credential.endpointId.trim() !== "") {
      const endpoint = this.soap.findSoapEndpoint(credential.endpointId);
      if (!endpoint) {
        return {
          ok: false,
          code: "TISS_AUTH_ENDPOINT_NOT_FOUND",
          message: `endpoint ${credential.endpointId} not found`,
        };
      }
    }

    this.credentials.set(credential.credentialId, credential);

    return {
      ok: true,
      credentialId: credential.credentialId,
      code: "TISS_AUTH_CREDENTIAL_REGISTERED",
      message: "authentication credential registered",
      credential,
    };
  }

  findCredential(credentialId: string): TissAuthenticationCredential | undefined {
    return this.credentials.get(credentialId);
  }

  listCredentials(channelId?: string): TissAuthenticationCredential[] {
    const all = Array.from(this.credentials.values());
    if (!channelId) return all;
    return all.filter((c) => c.channelId === channelId);
  }

  stats(): TissAuthenticationCredentialStats {
    const all = this.listCredentials();
    const channelIds = new Set<string>();
    const endpointIds = new Set<string>();
    const credentialTypes = new Set<string>();
    for (const c of all) {
      channelIds.add(c.channelId);
      if (c.endpointId) endpointIds.add(c.endpointId);
      credentialTypes.add(c.credentialType);
    }
    return {
      totalCredentials: all.length,
      credentialIds: all.map((c) => c.credentialId),
      channelIds: Array.from(channelIds),
      endpointIds: Array.from(endpointIds),
      credentialTypes: Array.from(credentialTypes),
    };
  }
}
