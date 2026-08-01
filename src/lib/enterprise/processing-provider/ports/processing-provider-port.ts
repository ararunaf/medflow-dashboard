/**
 * ProcessingProviderPort — contrato único do Processing Provider Framework.
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de registry, store ou banco ficam nos adapters.
 *
 * EPC-14: fundação arquitetural genérica para registrar qualquer Processador futuro.
 * NÃO implementa OCR. NÃO implementa IA. NÃO implementa PDF/XML/Barcode/QRCode/HL7/DICOM.
 * NÃO altera Document Processing Foundation. NÃO executa processamento real.
 *
 * O Framework conhece apenas:
 *   Provider | Capabilities | Input | Output | Health | Configuration
 */
import type {
  GetProviderInput,
  GetProviderResult,
  ListProvidersInput,
  ListProvidersResult,
  ProcessingProviderCapabilities,
  ProcessingProviderHealth,
  ProcessingProviderProviderId,
  RegisterProviderInput,
  RegisterProviderResult,
  UnregisterProviderInput,
  UnregisterProviderResult,
} from "./types";

export interface ProcessingProviderPort {
  /** Identificador estável do mecanismo por trás do adapter. */
  readonly providerId: ProcessingProviderProviderId;

  /** Verificação leve de prontidão (sem processar documentos). */
  health(): Promise<ProcessingProviderHealth>;

  /** Capacidades estáticas do Framework adapter ativo. */
  capabilities(): ProcessingProviderCapabilities;

  /**
   * Registra um ProviderDescriptor no Framework (in-memory).
   * NÃO instancia OCR, IA, parsers ou I/O externo.
   */
  registerProvider(input: RegisterProviderInput): Promise<RegisterProviderResult>;

  /** Remove um Provider registrado pelo ProviderId. */
  unregisterProvider(input: UnregisterProviderInput): Promise<UnregisterProviderResult>;

  /** Obtém um ProviderDescriptor por ProviderId. */
  getProvider(input: GetProviderInput): Promise<GetProviderResult>;

  /** Lista Providers (filtros estruturais opcionais). */
  listProviders(input?: ListProvidersInput): Promise<ListProvidersResult>;
}
