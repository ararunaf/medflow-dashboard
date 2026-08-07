/**
 * TissEnginePort — G-01.
 *
 * Contrato único do Bloco G. Ativa G-01: TISS Knowledge.
 * Demais capabilities permanecem false.
 */
import type { TISSEnterpriseCapabilities } from "./capabilities";
import type {
  GetTissKnowledgeInput,
  GetTissKnowledgeResult,
  GetTissKnowledgeStatsInput,
  GetTissKnowledgeStatsResult,
  GetTissLayoutInput,
  GetTissLayoutResult,
  GetTissLayoutStatsInput,
  GetTissLayoutStatsResult,
  GetTissParserInput,
  GetTissParserResult,
  GetTissParserStatsInput,
  GetTissParserStatsResult,
  ListTissKnowledgeInput,
  ListTissKnowledgeResult,
  ListTissLayoutInput,
  ListTissLayoutResult,
  ListTissParsersInput,
  ListTissParsersResult,
  ParseTissInput,
  ParseTissResult,
  RegisterTissKnowledgeInput,
  RegisterTissKnowledgeResult,
  RegisterTissLayoutInput,
  RegisterTissLayoutResult,
  RegisterTissParserInput,
  RegisterTissParserResult,
  SearchTissKnowledgeInput,
  SearchTissKnowledgeResult,
  SearchTissLayoutInput,
  SearchTissLayoutResult,
  TissEngineHealth,
  TissEngineInfo,
} from "./types";

export interface TissEnginePort {
  /** G-01 — identidade do adapter/provider. */
  identity(): TissEngineInfo;

  /** G-01 — matriz de capabilities. */
  getCapabilities(): TISSEnterpriseCapabilities;

  /** G-01 — health check do engine. */
  health(): Promise<TissEngineHealth>;

  /** G-01 — registrar conhecimento TISS. */
  registerTissKnowledge(input: RegisterTissKnowledgeInput): Promise<RegisterTissKnowledgeResult>;

  /** G-01 — recuperar conhecimento por id. */
  getTissKnowledge(input: GetTissKnowledgeInput): Promise<GetTissKnowledgeResult>;

  /** G-01 — listar conhecimentos (opcionalmente por tag). */
  listTissKnowledge(input?: ListTissKnowledgeInput): Promise<ListTissKnowledgeResult>;

  /** G-01 — pesquisar conhecimentos por nome. */
  searchTissKnowledge(input: SearchTissKnowledgeInput): Promise<SearchTissKnowledgeResult>;

  /** G-01 — estatísticas do catálogo de conhecimento. */
  getTissKnowledgeStats(input?: GetTissKnowledgeStatsInput): Promise<GetTissKnowledgeStatsResult>;

  /** G-02 — registrar layout TISS. */
  registerTissLayout(input: RegisterTissLayoutInput): Promise<RegisterTissLayoutResult>;

  /** G-02 — recuperar layout por id. */
  getTissLayout(input: GetTissLayoutInput): Promise<GetTissLayoutResult>;

  /** G-02 — listar layouts. */
  listTissLayout(input?: ListTissLayoutInput): Promise<ListTissLayoutResult>;

  /** G-02 — pesquisar layouts. */
  searchTissLayout(input: SearchTissLayoutInput): Promise<SearchTissLayoutResult>;

  /** G-02 — estatísticas de layouts. */
  getTissLayoutStats(input?: GetTissLayoutStatsInput): Promise<GetTissLayoutStatsResult>;

  /** G-03 — registrar parser TISS. */
  registerTissParser(input: RegisterTissParserInput): Promise<RegisterTissParserResult>;

  /** G-03 — recuperar parser por id. */
  getTissParser(input: GetTissParserInput): Promise<GetTissParserResult>;

  /** G-03 — listar parsers. */
  listTissParsers(input?: ListTissParsersInput): Promise<ListTissParsersResult>;

  /** G-03 — converter documento TISS em representação canônica. */
  parseTiss(input: ParseTissInput): Promise<ParseTissResult>;

  /** G-03 — estatísticas de parsers. */
  getTissParserStats(input?: GetTissParserStatsInput): Promise<GetTissParserStatsResult>;
}
