/**
 * ScannerRuntimePort — contrato único do Enterprise Scanner Runtime (F3-CAP-01).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para gerenciar Scanners canônicos estruturais.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → ScannerRuntimePort
 *     → Adapter → Scanner Runtime Store → Canonical Scanner Result
 *
 * F3-CAP-01: infraestrutura canônica apenas — sem Scanner real / TWAIN / WIA / ISIS.
 */
import type {
  AcquireScannerInput,
  AcquireScannerResult,
  CloseScannerSessionInput,
  CloseScannerSessionResult,
  DiscoverScannersInput,
  DiscoverScannersResult,
  OpenScannerSessionInput,
  OpenScannerSessionResult,
  RegisterScannerInput,
  RegisterScannerResult,
  ScannerRuntimeHealth,
  ScannerRuntimeInfo,
  ScannerRuntimePortCapabilities,
  ScannerRuntimeProviderId,
  ScannerStatsInput,
  ScannerStatsResult,
  UnregisterScannerInput,
  UnregisterScannerResult,
} from "./types";

export interface ScannerRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ScannerRuntimeProviderId;

  /**
   * Registra estruturalmente um Scanner no store in-memory.
   * NÃO abre drivers. NÃO detecta hardware. NÃO captura.
   */
  register(input: RegisterScannerInput): Promise<RegisterScannerResult>;

  /**
   * Remove estruturalmente um Scanner do store.
   * NÃO libera drivers reais (não há drivers).
   */
  unregister(input: UnregisterScannerInput): Promise<UnregisterScannerResult>;

  /**
   * Descoberta estrutural de Scanners (catálogo in-memory).
   * NÃO enumera TWAIN/WIA/ISIS/USB/Rede.
   */
  discover(input?: DiscoverScannersInput): Promise<DiscoverScannersResult>;

  /**
   * Abre sessão estrutural de Scanner.
   * NÃO abre sessão de driver. NÃO aloca hardware.
   */
  openSession(input: OpenScannerSessionInput): Promise<OpenScannerSessionResult>;

  /**
   * Fecha sessão estrutural de Scanner.
   * NÃO fecha drivers reais.
   */
  closeSession(input: CloseScannerSessionInput): Promise<CloseScannerSessionResult>;

  /**
   * Aquisição estrutural (registro canônico apenas).
   * NÃO captura páginas. NÃO invoca OCR. NÃO faz upload.
   */
  acquire(input: AcquireScannerInput): Promise<AcquireScannerResult>;

  /**
   * Estatísticas estruturais do store in-memory.
   */
  stats(input?: ScannerStatsInput): Promise<ScannerStatsResult>;

  /** Verificação leve de prontidão (sem alterar Scanners). */
  health(): Promise<ScannerRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ScannerRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): ScannerRuntimeInfo;
}
