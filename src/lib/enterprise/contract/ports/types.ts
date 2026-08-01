/**
 * Tipos vendor-agnósticos da camada Contract Foundation — EPC-11.
 *
 * Nenhum tipo clínico, TISS, operadora, cooperativa, Unimed, Hapvida,
 * Bradesco, OCR, IA, Rule Engine, Workflow de produto ou validação
 * contratual deve aparecer aqui.
 *
 * Contract é apenas um modelo canônico genérico de representação
 * documental / organizacional. Ele NÃO contém regras, NÃO executa
 * regras e NÃO conhece TISS / OCR / IA.
 *
 * Arquitetura obrigatória:
 *   Contract → Metadata → Rule Pack References → Workflow References
 *            → Configuration References → Resultado (futuro)
 */

/** Provedores / mecanismos de contract (extensível). */
export type ContractProviderId = "default" | "mock" | "test" | "database" | "remote" | "registry";

/** Resultado de health check. */
export type ContractHealth = {
  ok: boolean;
  provider: ContractProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Usado por Application/Domain sem conhecer o store.
 */
export type ContractCapabilities = {
  provider: ContractProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsCreateContract: boolean;
  supportsGetContract: boolean;
  supportsListContracts: boolean;
  /** Versionamento estrutural (sem operação de publicação real). */
  supportsVersioning: boolean;
  /** Anexos via referências opacas. */
  supportsAttachments: boolean;
  /** Referências opacas a Rule Packs. */
  supportsRulePackReferences: boolean;
  /** Referências opacas a Workflow. */
  supportsWorkflowReferences: boolean;
  /** Referências opacas a Configuration. */
  supportsConfigurationReference: boolean;
  /** Referências opacas a Metadata Engine. */
  supportsMetadataReference: boolean;
  /** Prep: anexos podem apontar Document Identity (ids opacos). */
  supportsDocumentIdentityReferences: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Identidade / status / versionamento
 * ───────────────────────────────────────────────────────────────────────── */

/** Identificador estável de um Contrato. */
export type ContractId = string;

/** Nome lógico do contrato. */
export type ContractName = string;

/** Tag genérica — classificação livre. */
export type ContractTag = string;

/** Versão estrutural do contrato (rótulo livre). */
export type ContractVersionLabel = string;

/**
 * Status / lifecycle estrutural do contrato (FASE 8).
 * Preparação: Draft | Published | Deprecated | Archived | Rollback.
 * Sem implementação operacional de publicação / rollback nesta sprint.
 */
export type ContractStatus =
  | "draft"
  | "published"
  | "deprecated"
  | "archived"
  | "rollback"
  | (string & {});

export const CONTRACT_STATUSES: readonly ContractStatus[] = [
  "draft",
  "published",
  "deprecated",
  "archived",
  "rollback",
] as const;

/**
 * Capacidade declarada pelo próprio contrato (campo do modelo).
 * Distinta de ContractCapabilities (adapter/Port).
 */
export type ContractDeclaredCapability = string;

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem acoplamento a Engines)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a artefato do Metadata Engine. */
export type ContractMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a um Rule Pack (sem import do módulo rule-pack). */
export type ContractRulePackReference = {
  packId?: string;
  name?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a um Workflow (sem import do módulo workflow). */
export type ContractWorkflowReference = {
  workflowId?: string;
  name?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Configuration Engine. */
export type ContractConfigurationReference = {
  id?: string;
  key?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/**
 * Referência opaca a Document Identity (prep).
 * Usada via AttachmentReferences — sem acoplamento ao DocumentIdentityPort.
 */
export type ContractDocumentIdentityReference = {
  documentId?: string;
  documentType?: string;
  version?: string;
  kind?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Modelos auxiliares (FASE 7) — todos genéricos, sem lógica
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * ContractVersion — bloco / registro estrutural de versão.
 * Sem persistência operacional; sem política de publicação.
 */
export type ContractVersion = {
  version: ContractVersionLabel;
  previousVersion?: ContractVersionLabel;
  nextVersion?: ContractVersionLabel;
  status?: ContractStatus;
  /** Alvo de rollback (rótulo) — prep, sem operação. */
  rollbackTarget?: ContractVersionLabel;
  effectiveDate?: string;
  expirationDate?: string;
  notes?: string;
};

/** Anexo estrutural — apenas metadados / refs opacas. */
export type ContractAttachment = {
  id?: string;
  name?: string;
  mimeType?: string;
  fileSize?: number;
  /** Ref opaca a Document Identity. */
  documentIdentityReference?: ContractDocumentIdentityReference;
  /** Ref opaca a storage / URI. */
  uri?: string;
  tags?: readonly ContractTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
};

/** Cláusula genérica — sem validação, sem semântica clínica. */
export type ContractClause = {
  id?: string;
  code?: string;
  title?: string;
  body?: string;
  sequence?: number;
  tags?: readonly ContractTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
};

/** Seção genérica — agrupamento estrutural de cláusulas / texto. */
export type ContractSection = {
  id?: string;
  code?: string;
  title?: string;
  body?: string;
  sequence?: number;
  clauseIds?: readonly string[];
  tags?: readonly ContractTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
};

/**
 * Referência genérica a qualquer artefato Enterprise / externo.
 * Ids e kinds são strings opacas.
 */
export type ContractReference = {
  id?: string;
  kind?: string;
  name?: string;
  version?: string;
  uri?: string;
  target?: string;
};

/**
 * Bloco de versionamento agregado (helpers / prep FASE 8).
 */
export type ContractVersionInfo = {
  version: ContractVersionLabel;
  previousVersion?: ContractVersionLabel;
  nextVersion?: ContractVersionLabel;
  status?: ContractStatus;
  rollbackTarget?: ContractVersionLabel;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Modelo canônico do Contrato (FASE 6)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Contract — estrutura canônica genérica.
 *
 * Campos permitidos (exclusivos):
 * ContractId | Name | Description | Version | Status |
 * EffectiveDate | ExpirationDate | MetadataReference |
 * RulePackReferences | WorkflowReferences | ConfigurationReference |
 * AttachmentReferences | Tags | CustomAttributes | Capabilities
 *
 * Nada além disso no núcleo tipado.
 *
 * Auxiliares (ContractVersion, ContractClause, ContractSection,
 * ContractReference) vivem fora do núcleo tipado e podem ser
 * transportados via customAttributes ou documentação futura —
 * NÃO expandem o conjunto de campos canônicos.
 */
export type Contract = {
  contractId: ContractId;
  name: ContractName;
  description?: string;
  version: ContractVersionLabel;
  status: ContractStatus;
  effectiveDate?: string;
  expirationDate?: string;
  metadataReference?: ContractMetadataReference;
  rulePackReferences?: readonly ContractRulePackReference[];
  workflowReferences?: readonly ContractWorkflowReference[];
  configurationReference?: ContractConfigurationReference;
  attachmentReferences?: readonly ContractAttachment[];
  tags?: readonly ContractTag[];
  /** Atributos livres opacos — sem schema clínico / TISS. */
  customAttributes?: Readonly<Record<string, unknown>>;
  /** Capacidades declaradas pelo contrato (não confundir com Port capabilities). */
  capabilities?: readonly ContractDeclaredCapability[];
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Input de criação — campos gerados pelo adapter quando omitidos:
 * contractId, status/version defaults.
 */
export type CreateContractInput = {
  contract: Omit<Contract, "contractId" | "status" | "version"> & {
    contractId?: ContractId;
    status?: ContractStatus;
    version?: ContractVersionLabel;
  };
};

export type CreateContractResult = {
  ok: boolean;
  contractId: ContractId;
  contract?: Contract;
  message?: string;
  code?: string;
};

export type GetContractInput = {
  contractId: ContractId;
};

export type GetContractResult = {
  ok: boolean;
  contract?: Contract;
  message?: string;
  code?: string;
};

export type ListContractsInput = {
  status?: ContractStatus;
  tag?: ContractTag;
  /** Prefixo de contractId opcional. */
  idPrefix?: string;
  /** Prefixo de name opcional. */
  namePrefix?: string;
  /** PackId opaco — filtra contratos que referenciam este Rule Pack. */
  rulePackId?: string;
  /** WorkflowId opaco — filtra contratos que referenciam este Workflow. */
  workflowId?: string;
};

export type ListContractsResult = {
  ok: boolean;
  contracts: readonly Contract[];
  message?: string;
  code?: string;
};

/** Opções de resolução do ContractPort (provider factory). */
export type ContractProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: ContractProviderId;
};
