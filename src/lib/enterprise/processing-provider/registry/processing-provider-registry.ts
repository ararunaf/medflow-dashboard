/**
 * ProcessingProviderRegistry — catálogo de Processing Providers (EPC-14).
 *
 * Responsável apenas por registrar Providers (descriptors).
 * Nenhum processamento será executado.
 * Nenhum Provider conhece outro Provider.
 * Sem lógica de negócio. Sem chamadas de rede. Sem OCR/IA/parsers.
 */
import type {
  HealthStatus,
  ListProvidersInput,
  ProviderDescriptor,
  ProviderId,
  ProviderType,
} from "../ports/types";

export type ProcessingProviderRegistrySnapshot = {
  registrations: readonly ProviderDescriptor[];
  count: number;
};

export type ProcessingProviderRegistryOptions = {
  /** Seed opcional de descriptors (stubs / testes). Default: vazio. */
  seed?: readonly ProviderDescriptor[];
};

/**
 * Registry genérico in-memory.
 * Foundation: nenhum Provider funcional — apenas infraestrutura de catálogo.
 */
export class ProcessingProviderRegistry {
  private readonly byId = new Map<ProviderId, ProviderDescriptor>();

  constructor(options: ProcessingProviderRegistryOptions = {}) {
    for (const entry of options.seed ?? []) {
      this.byId.set(entry.providerId, cloneDescriptor(entry));
    }
  }

  /** Registra ou substitui um ProviderDescriptor. */
  register(entry: ProviderDescriptor): void {
    this.byId.set(entry.providerId, cloneDescriptor(entry));
  }

  /** Remove um Provider. Retorna true se existia. */
  unregister(providerId: ProviderId): boolean {
    return this.byId.delete(providerId);
  }

  get(providerId: ProviderId): ProviderDescriptor | undefined {
    const entry = this.byId.get(providerId);
    return entry ? cloneDescriptor(entry) : undefined;
  }

  has(providerId: ProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly ProviderDescriptor[] {
    return Array.from(this.byId.values()).map(cloneDescriptor);
  }

  listByType(providerType: ProviderType): readonly ProviderDescriptor[] {
    return this.list().filter((entry) => entry.providerType === providerType);
  }

  listByHealthStatus(healthStatus: HealthStatus): readonly ProviderDescriptor[] {
    return this.list().filter((entry) => entry.healthStatus === healthStatus);
  }

  listEnabled(): readonly ProviderDescriptor[] {
    return this.list().filter((entry) => entry.enabled === true);
  }

  /**
   * Lista com filtros estruturais (seleção futura por capacidades).
   * Sem roteamento / sem execução.
   */
  listFiltered(input: ListProvidersInput = {}): readonly ProviderDescriptor[] {
    return this.list().filter((provider) => matchesList(provider, input));
  }

  count(): number {
    return this.byId.size;
  }

  snapshot(): ProcessingProviderRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }

  health(): { ok: boolean; message?: string; count: number } {
    return {
      ok: true,
      count: this.byId.size,
      message: "ProcessingProviderRegistry pronto (sem I/O externo — EPC-14).",
    };
  }
}

/** Registry default vazio — nenhum Provider funcional na fundação. */
export function createDefaultProcessingProviderRegistry(
  options: ProcessingProviderRegistryOptions = {},
): ProcessingProviderRegistry {
  return new ProcessingProviderRegistry(options);
}

/** Contagem canônica de Providers funcionais na fundação: zero. */
export const BUILTIN_PROCESSING_PROVIDER_COUNT = 0;

function cloneDescriptor(entry: ProviderDescriptor): ProviderDescriptor {
  return {
    ...entry,
    capabilities: { ...entry.capabilities },
    tags: entry.tags ? [...entry.tags] : undefined,
    customAttributes: entry.customAttributes ? { ...entry.customAttributes } : undefined,
    configurationReference: entry.configurationReference
      ? { ...entry.configurationReference }
      : undefined,
    metadataReference: entry.metadataReference ? { ...entry.metadataReference } : undefined,
  };
}

function matchesList(provider: ProviderDescriptor, input: ListProvidersInput): boolean {
  if (input.providerType != null && provider.providerType !== input.providerType) {
    return false;
  }
  if (input.enabled != null && (provider.enabled ?? false) !== input.enabled) {
    return false;
  }
  if (input.healthStatus != null && provider.healthStatus !== input.healthStatus) {
    return false;
  }
  if (input.tag != null && !(provider.tags ?? []).includes(input.tag)) {
    return false;
  }
  if (input.idPrefix != null && !provider.providerId.startsWith(input.idPrefix)) {
    return false;
  }
  if (input.requiresAsync === true && provider.capabilities.supportsAsync !== true) {
    return false;
  }
  if (input.requiresBatch === true && provider.capabilities.supportsBatch !== true) {
    return false;
  }
  if (input.requiresStreaming === true && provider.capabilities.supportsStreaming !== true) {
    return false;
  }
  return true;
}
