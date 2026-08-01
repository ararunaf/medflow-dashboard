/**
 * PipelineResolverPort — contrato único de resolução dinâmica de pipeline (EPC-24 Sprint 02).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Resolve estruturalmente quais módulos (Ports oficiais) participam da execução.
 * NÃO executa OCR, IA, Mapping, regras, validações ou parsers.
 * Nenhuma etapa do pipeline é executada — apenas composição estrutural.
 */
import type {
  GetPipelineInput,
  GetPipelineResult,
  ListPipelinesInput,
  ListPipelinesResult,
  PipelineCapabilities,
  PipelineResolverHealth,
  PipelineResolverProviderId,
  ResolvePipelineInput,
  ResolvePipelineResult,
} from "./types";

export interface PipelineResolverPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: PipelineResolverProviderId;

  /**
   * Resolve dinamicamente a composição completa do pipeline
   * a partir dos Ports oficiais — sem executar qualquer etapa.
   */
  resolvePipeline(input?: ResolvePipelineInput): Promise<ResolvePipelineResult>;

  /** Obtém uma definição de pipeline por id. */
  getPipeline(input: GetPipelineInput): Promise<GetPipelineResult>;

  /** Lista definições de pipeline conhecidas. */
  listPipelines(input?: ListPipelinesInput): Promise<ListPipelinesResult>;

  /** Verificação leve de prontidão (sem alterar resoluções). */
  health(): Promise<PipelineResolverHealth>;

  /** Capacidades estáticas do adapter ativo (PipelineCapabilities). */
  capabilities(): PipelineCapabilities;
}
