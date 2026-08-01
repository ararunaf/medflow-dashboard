/**
 * Helpers estruturais de ProviderCapabilities — EPC-14 FASE 6.
 *
 * Sem lógica de seleção, roteamento ou execução.
 * Preparação declarativa para seleção futura por capacidades.
 */
import type { ProviderCapabilities, ProviderDescriptor } from "./types";

/** Capabilities vazias canônicas. */
export function emptyProviderCapabilities(): ProviderCapabilities {
  return {};
}

/** True se o descriptor declara suporte a processamento assíncrono. */
export function declaresAsync(provider: ProviderDescriptor): boolean {
  return provider.capabilities.supportsAsync === true;
}

/** True se o descriptor declara suporte a lote. */
export function declaresBatch(provider: ProviderDescriptor): boolean {
  return provider.capabilities.supportsBatch === true;
}

/** True se o descriptor declara suporte a streaming. */
export function declaresStreaming(provider: ProviderDescriptor): boolean {
  return provider.capabilities.supportsStreaming === true;
}

/** True se o descriptor declara suporte a confidence. */
export function declaresConfidence(provider: ProviderDescriptor): boolean {
  return provider.capabilities.supportsConfidence === true;
}

/** True se o descriptor declara suporte a metadata. */
export function declaresMetadata(provider: ProviderDescriptor): boolean {
  return provider.capabilities.supportsMetadata === true;
}

/** True se o descriptor declara suporte a attachments. */
export function declaresAttachments(provider: ProviderDescriptor): boolean {
  return provider.capabilities.supportsAttachments === true;
}

/**
 * Define / normaliza um bloco de capabilities (estrutural).
 * Sem validação de domínio.
 */
export function defineProviderCapabilities(
  capabilities: ProviderCapabilities = {},
): ProviderCapabilities {
  return { ...capabilities };
}
