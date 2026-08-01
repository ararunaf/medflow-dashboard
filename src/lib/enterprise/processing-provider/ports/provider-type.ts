/**
 * Helpers de ProviderType — EPC-14 FASE 7.
 *
 * Somente enumeração / inspeção estrutural. Sem lógica de OCR, PDF, XML,
 * Barcode, QRCode, HL7, DICOM, IA ou I/O.
 */
import type { ProviderDescriptor, ProviderType } from "./types";
import { PROVIDER_TYPES } from "./types";

/** True se o ProviderType é um dos conhecidos (FASE 7). */
export function hasKnownProviderType(providerType: ProviderType): boolean {
  return (PROVIDER_TYPES as readonly string[]).includes(providerType);
}

/** True se o descriptor declara um ProviderType conhecido. */
export function providerHasKnownProviderType(provider: ProviderDescriptor): boolean {
  return hasKnownProviderType(provider.providerType);
}

/** Lista os ProviderTypes canônicos (cópia estrutural). */
export function listProviderTypes(): readonly ProviderType[] {
  return [...PROVIDER_TYPES];
}
