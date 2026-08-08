/**
 * TissCommunicationEngine — H-01.
 *
 * Catálogo de canais de comunicação TISS com operadoras.
 * Não abre conexões, não envia, não autentica e não processa SOAP.
 * Reutiliza IntegrationRegistryEngine e IntegrationConnectorEngine do Bloco F.
 */
import { IntegrationConnectorEngine, IntegrationRegistryEngine } from "../../integration-engine";
import type {
  CanonicalIntegration,
  CanonicalIntegrationConnector,
} from "../../integration-engine/ports";

export interface TissCommunicationChannel {
  readonly kind: "tiss-communication-channel";
  readonly channelId: string;
  readonly operatorId: string;
  readonly operatorName?: string;
  readonly name: string;
  readonly protocol?: "https" | "http" | "soap" | "rest";
  readonly endpoint?: string;
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface TissCommunicationChannelResult {
  readonly ok: boolean;
  readonly channelId?: string;
  readonly code: string;
  readonly message: string;
  readonly channel?: TissCommunicationChannel | null;
}

export interface TissCommunicationStats {
  readonly totalChannels: number;
  readonly channelIds: readonly string[];
  readonly operatorIds: readonly string[];
  readonly tags: readonly string[];
}

export interface TISSIntegrationCapabilities {
  readonly tissCommunicationImplemented: boolean;
  readonly tissSoapImplemented: boolean;
  readonly tissAuthenticationImplemented: boolean;
  readonly tissSubmissionImplemented: boolean;
  readonly tissBatchImplemented: boolean;
  readonly tissReturnProcessingImplemented: boolean;
  readonly tissStatusTrackingImplemented: boolean;
  readonly tissRetryImplemented: boolean;
  readonly tissAuditImplemented: boolean;
  readonly tissIntegrationEngineImplemented: boolean;
}

export const H01_TISS_INTEGRATION_CAPABILITIES: TISSIntegrationCapabilities = {
  tissCommunicationImplemented: true,
  tissSoapImplemented: false,
  tissAuthenticationImplemented: false,
  tissSubmissionImplemented: false,
  tissBatchImplemented: false,
  tissReturnProcessingImplemented: false,
  tissStatusTrackingImplemented: false,
  tissRetryImplemented: false,
  tissAuditImplemented: false,
  tissIntegrationEngineImplemented: false,
};

function channelToConnector(channel: TissCommunicationChannel): CanonicalIntegrationConnector {
  return {
    kind: "canonical-integration-connector",
    connectorId: channel.channelId,
    integrationId: channel.operatorId,
    name: channel.name,
    description: undefined,
    configuration: {
      protocol: channel.protocol,
      endpoint: channel.endpoint,
    },
    tags: channel.tags,
    metadata: channel.metadata,
  };
}

function connectorToChannel(
  connector: CanonicalIntegrationConnector | undefined,
): TissCommunicationChannel | undefined {
  if (!connector) return undefined;
  const cfg = connector.configuration ?? {};
  return {
    kind: "tiss-communication-channel",
    channelId: connector.connectorId,
    operatorId: connector.integrationId,
    name: connector.name,
    protocol: cfg["protocol"] as TissCommunicationChannel["protocol"],
    endpoint: typeof cfg["endpoint"] === "string" ? cfg["endpoint"] : undefined,
    tags: connector.tags,
    metadata: connector.metadata,
  };
}

export class TissCommunicationEngine {
  private readonly registry: IntegrationRegistryEngine;
  private readonly connector: IntegrationConnectorEngine;

  constructor(
    registry: IntegrationRegistryEngine = new IntegrationRegistryEngine(),
    connector: IntegrationConnectorEngine = new IntegrationConnectorEngine(registry),
  ) {
    this.registry = registry;
    this.connector = connector;
  }

  getCapabilities(): TISSIntegrationCapabilities {
    return H01_TISS_INTEGRATION_CAPABILITIES;
  }

  private ensureOperator(operatorId: string, operatorName?: string): void {
    if (this.registry.find(operatorId)) return;
    const integration: CanonicalIntegration = {
      kind: "canonical-integration",
      integrationId: operatorId,
      name: operatorName ?? operatorId,
      category: "tiss-operator",
      tags: ["tiss", "operator"],
    };
    this.registry.register(integration);
  }

  registerChannel(channel: TissCommunicationChannel): TissCommunicationChannelResult {
    if (!channel.channelId || channel.channelId.trim() === "") {
      return {
        ok: false,
        code: "TISS_COMMUNICATION_INVALID_CHANNEL_ID",
        message: "channelId is required",
      };
    }
    if (!channel.operatorId || channel.operatorId.trim() === "") {
      return {
        ok: false,
        code: "TISS_COMMUNICATION_INVALID_OPERATOR_ID",
        message: "operatorId is required",
      };
    }
    if (!channel.name || channel.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_COMMUNICATION_INVALID_NAME",
        message: "name is required",
      };
    }

    this.ensureOperator(channel.operatorId, channel.operatorName);

    const connector = channelToConnector(channel);
    const result = this.connector.register(connector);

    if (!result.ok) {
      return {
        ok: false,
        code: `TISS_COMMUNICATION_${result.code}`,
        message: result.message,
      };
    }

    return {
      ok: true,
      channelId: channel.channelId,
      code: "TISS_COMMUNICATION_CHANNEL_REGISTERED",
      message: "communication channel registered",
      channel: connectorToChannel(result.connector ?? connector) ?? connectorToChannel(connector)!,
    };
  }

  findChannel(channelId: string): TissCommunicationChannel | undefined {
    const connector = this.connector.find(channelId);
    return connectorToChannel(connector);
  }

  listChannels(operatorId?: string, limit?: number, offset?: number): TissCommunicationChannel[] {
    return this.connector
      .list(operatorId, limit, offset)
      .map((c) => connectorToChannel(c))
      .filter((c): c is TissCommunicationChannel => c !== undefined);
  }

  stats(): TissCommunicationStats {
    const connectorStats = this.connector.stats();
    const channels = this.listChannels();
    const operatorIds = new Set<string>();
    const tags = new Set<string>();
    for (const channel of channels) {
      operatorIds.add(channel.operatorId);
      for (const tag of channel.tags ?? []) tags.add(tag);
    }
    return {
      totalChannels: connectorStats.totalConnectors,
      channelIds: connectorStats.connectorIds,
      operatorIds: Array.from(operatorIds),
      tags: Array.from(tags),
    };
  }
}
