import type {
  OperationalContextPayload,
  OperationalSemanticSnapshot,
} from "@/lib/operations/copilot-context/types";
import type { OperationalGptToolTraceEntry } from "@/lib/operations/copilot-gpt/operational-gpt-tool-executor";

/** Pedido ao servidor — contexto já materializado no cliente (fingerprint para auditoria). */
export type OperationalCopilotGptRequest = {
  mode: "chat" | "executive_narrative";
  /** Pergunta do coordenador; ignorado em `executive_narrative`. */
  question?: string;
  operationalContextPayload: OperationalContextPayload;
  semanticSnapshot: OperationalSemanticSnapshot;
};

export type OperationalCopilotGptResponseData = {
  assistantMessage: string;
  fingerprintEcho: string;
  model: string;
  correlationId: string;
  /** Modo chat com tools: trilha de execução (read-only + proposta supervisionada; sem mutações operacionais). */
  toolTrace?: OperationalGptToolTraceEntry[];
  toolCallCount?: number;
  toolRounds?: number;
};
