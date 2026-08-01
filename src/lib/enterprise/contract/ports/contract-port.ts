/**
 * ContractPort — contrato único de Contract Foundation (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, registry ou banco ficam nos adapters.
 *
 * EPC-11: fundação arquitetural genérica.
 * NÃO conhece TISS, Operadoras, Cooperativas, Unimed, Hapvida, Bradesco,
 * OCR, IA, Rule Engine, Workflow clínico ou validação contratual.
 *
 * Contract é apenas um modelo canônico genérico.
 * Ele NÃO contém regras e NÃO executa regras.
 */
import type {
  ContractCapabilities,
  ContractHealth,
  ContractProviderId,
  CreateContractInput,
  CreateContractResult,
  GetContractInput,
  GetContractResult,
  ListContractsInput,
  ListContractsResult,
} from "./types";

export interface ContractPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ContractProviderId;

  /** Verificação leve de prontidão (sem alterar contratos). */
  health(): Promise<ContractHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ContractCapabilities;

  /** Cria / registra um Contrato canônico. */
  createContract(input: CreateContractInput): Promise<CreateContractResult>;

  /** Obtém um contrato por ContractId. */
  getContract(input: GetContractInput): Promise<GetContractResult>;

  /** Lista contratos (filtros estruturais opcionais). */
  listContracts(input?: ListContractsInput): Promise<ListContractsResult>;
}
