/**
 * XMLRuntimePort — contrato único do Enterprise XML Runtime (TISS-04 + D-01).
 *
 * Application / TISS Runtime dependem exclusivamente desta interface.
 * Nenhum acesso direto ao XML Store é permitido.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → Adapter → XML Generation Store → Canonical XML Result
 *
 * D-01: parse(xml) — parser XML genérico funcional (sem TISS / sem Operadoras).
 * TISS-04/TISS-05: fundação estrutural + geração canônica — sem XML TISS/ANS real.
 */
import type {
  CancelXMLInput,
  CancelXMLResult,
  GenerateXMLInput,
  GenerateXMLResult,
  GetXMLGenerationInput,
  GetXMLGenerationResult,
  ListXMLGenerationsInput,
  ListXMLGenerationsResult,
  ParseXMLInput,
  ParseXMLResult,
  ValidateXMLInput,
  ValidateXMLResult,
  XMLRuntimeHealth,
  XMLRuntimeInfo,
  XMLRuntimePortCapabilities,
  XMLRuntimeProviderId,
} from "./types";

export interface XMLRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: XMLRuntimeProviderId;

  /**
   * Gera resultado canônico estrutural.
   * NÃO produz XML real na fundação TISS-04.
   * Consome exclusivamente TISSCatalogPort + RulePackEnginePort.
   */
  generate(input: GenerateXMLInput): Promise<GenerateXMLResult>;

  /**
   * Valida estruturalmente um pedido / geração canônica.
   * Sem regras ANS / operadora / contrato.
   */
  validate(input: ValidateXMLInput): Promise<ValidateXMLResult>;

  /** Cancela uma geração canônica por id. */
  cancel(input: CancelXMLInput): Promise<CancelXMLResult>;

  getGeneration(input: GetXMLGenerationInput): Promise<GetXMLGenerationResult>;
  listGenerations(input?: ListXMLGenerationsInput): Promise<ListXMLGenerationsResult>;

  /**
   * D-01 — Parser XML funcional genérico.
   * Recebe XML em string, valida sintaxe, constrói DOM canônico.
   * Sem TISS. Sem Operadoras. Sem XSD. Sem SOAP. Sem XPath.
   */
  parse(input: ParseXMLInput): Promise<ParseXMLResult>;

  health(): Promise<XMLRuntimeHealth>;
  capabilities(): XMLRuntimePortCapabilities;
  providerInfo(): XMLRuntimeInfo;
}
