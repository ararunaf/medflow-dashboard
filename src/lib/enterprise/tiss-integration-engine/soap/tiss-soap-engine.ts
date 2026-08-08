/**
 * TissSoapEngine — H-02.
 *
 * Camada de abstração SOAP TISS.
 * Reutiliza TissCommunicationEngine (H-01) para canais de comunicação.
 * Não implementa autenticação, envio, processamento de retorno, retry ou auditoria.
 */
import {
  H02_TISS_INTEGRATION_CAPABILITIES,
  type TISSIntegrationCapabilities,
} from "../ports/capabilities";
import { TissCommunicationEngine } from "../communication";

export interface TissSoapEndpoint {
  readonly kind: "tiss-soap-endpoint";
  readonly endpointId: string;
  readonly channelId: string;
  readonly name: string;
  readonly endpoint: string;
  readonly soapVersion?: "1.1" | "1.2";
  readonly metadata?: Record<string, unknown>;
}

export interface TissSoapEndpointResult {
  readonly ok: boolean;
  readonly endpointId?: string;
  readonly code: string;
  readonly message: string;
  readonly endpoint?: TissSoapEndpoint | null;
}

export interface TissSoapEndpointStats {
  readonly totalEndpoints: number;
  readonly endpointIds: readonly string[];
  readonly channelIds: readonly string[];
}

export class TissSoapEngine {
  private readonly communication: TissCommunicationEngine;
  private readonly endpoints = new Map<string, TissSoapEndpoint>();

  constructor(communication: TissCommunicationEngine = new TissCommunicationEngine()) {
    this.communication = communication;
  }

  getCapabilities(): TISSIntegrationCapabilities {
    return H02_TISS_INTEGRATION_CAPABILITIES;
  }

  registerSoapEndpoint(endpoint: TissSoapEndpoint): TissSoapEndpointResult {
    if (!endpoint.endpointId || endpoint.endpointId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SOAP_INVALID_ENDPOINT_ID",
        message: "endpointId is required",
      };
    }
    if (!endpoint.channelId || endpoint.channelId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SOAP_INVALID_CHANNEL_ID",
        message: "channelId is required",
      };
    }
    if (!endpoint.name || endpoint.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_SOAP_INVALID_NAME",
        message: "name is required",
      };
    }
    if (!endpoint.endpoint || endpoint.endpoint.trim() === "") {
      return {
        ok: false,
        code: "TISS_SOAP_INVALID_ENDPOINT",
        message: "endpoint is required",
      };
    }

    const channel = this.communication.findChannel(endpoint.channelId);
    if (!channel) {
      return {
        ok: false,
        code: "TISS_SOAP_CHANNEL_NOT_FOUND",
        message: `channel ${endpoint.channelId} not found`,
      };
    }

    this.endpoints.set(endpoint.endpointId, endpoint);

    return {
      ok: true,
      endpointId: endpoint.endpointId,
      code: "TISS_SOAP_ENDPOINT_REGISTERED",
      message: "SOAP endpoint registered",
      endpoint,
    };
  }

  findSoapEndpoint(endpointId: string): TissSoapEndpoint | undefined {
    return this.endpoints.get(endpointId);
  }

  listSoapEndpoints(channelId?: string): TissSoapEndpoint[] {
    const all = Array.from(this.endpoints.values());
    if (!channelId) return all;
    return all.filter((e) => e.channelId === channelId);
  }

  stats(): TissSoapEndpointStats {
    const all = this.listSoapEndpoints();
    const channelIds = new Set<string>();
    for (const e of all) {
      channelIds.add(e.channelId);
    }
    return {
      totalEndpoints: all.length,
      endpointIds: all.map((e) => e.endpointId),
      channelIds: Array.from(channelIds),
    };
  }
}
