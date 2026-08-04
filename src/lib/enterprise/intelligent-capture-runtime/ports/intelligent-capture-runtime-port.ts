/**
 * IntelligentCaptureRuntimePort — contrato único do Enterprise Intelligent Capture Runtime (F3-CAP-04).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestrar estruturalmente Scanner / Watch Folder / Upload Runtimes.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → IntelligentCaptureRuntimePort
 *     → Adapter → Intelligent Capture Runtime Store → CaptureResult
 *
 * F3-CAP-04: infraestrutura canônica apenas — sem OCR / IA / Pipeline /
 * captura automática / leitura de arquivos / processamento documental.
 */
import type {
  CloseCaptureRequestInput,
  CloseCaptureRequestResult,
  DiscoverCaptureSourcesInput,
  DiscoverCaptureSourcesResult,
  EnvelopeCaptureInput,
  EnvelopeCaptureResult,
  IntelligentCaptureRuntimeHealth,
  IntelligentCaptureRuntimeInfo,
  IntelligentCaptureRuntimePortCapabilities,
  IntelligentCaptureRuntimeProviderId,
  OpenCaptureRequestInput,
  OpenCaptureRequestResult,
  RegisterCaptureSourceInput,
  RegisterCaptureSourceResult,
  RouteCaptureInput,
  RouteCaptureResult,
  CaptureStatsInput,
  CaptureStatsResult,
  UnregisterCaptureSourceInput,
  UnregisterCaptureSourceResult,
} from "./types";

export interface IntelligentCaptureRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: IntelligentCaptureRuntimeProviderId;

  /**
   * Registra estruturalmente uma CaptureSource no store in-memory.
   * NÃO abre Scanner. NÃO observa pasta. NÃO faz upload.
   */
  registerSource(input: RegisterCaptureSourceInput): Promise<RegisterCaptureSourceResult>;

  /**
   * Remove estruturalmente uma CaptureSource do store.
   * NÃO libera recursos reais (não há recursos).
   */
  unregisterSource(input: UnregisterCaptureSourceInput): Promise<UnregisterCaptureSourceResult>;

  /**
   * Descoberta estrutural de fontes (catálogo in-memory).
   * NÃO enumera Scanner/Watch Folder/Upload reais.
   */
  discoverSources(input?: DiscoverCaptureSourcesInput): Promise<DiscoverCaptureSourcesResult>;

  /**
   * Abre request estrutural de captura.
   * NÃO inicia captura. NÃO lê arquivos.
   */
  openRequest(input: OpenCaptureRequestInput): Promise<OpenCaptureRequestResult>;

  /**
   * Fecha request estrutural de captura.
   * NÃO interrompe captura real (não há captura).
   */
  closeRequest(input: CloseCaptureRequestInput): Promise<CloseCaptureRequestResult>;

  /**
   * Declaração estrutural de rota (CaptureRoute).
   * NÃO roteia documentos. NÃO seleciona runtime automaticamente.
   */
  route(input: RouteCaptureInput): Promise<RouteCaptureResult>;

  /**
   * Cria CaptureEnvelope estrutural.
   * NÃO embala arquivos. NÃO processa documentos.
   */
  envelope(input: EnvelopeCaptureInput): Promise<EnvelopeCaptureResult>;

  /**
   * Estatísticas estruturais do store in-memory.
   */
  stats(input?: CaptureStatsInput): Promise<CaptureStatsResult>;

  /** Verificação leve de prontidão (sem alterar fontes). */
  health(): Promise<IntelligentCaptureRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): IntelligentCaptureRuntimePortCapabilities;

  /** Metadados agregados do provedor. */
  providerInfo(): IntelligentCaptureRuntimeInfo;
}
