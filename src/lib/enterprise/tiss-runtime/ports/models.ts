/**
 * Modelos canônicos do TISS Runtime — TISS-01.
 *
 * Reutiliza CanonicalTISS* do TISS Provider. Sessão de coordenação é estrutural.
 */
import type {
  CanonicalTISSMetadata,
  CanonicalTISSRequest,
  CanonicalTISSResult,
  CanonicalTISSProfileReference,
  CanonicalTISSProviderReference,
} from "../../tiss-provider/ports/canonical";

export type TISSRuntimeSessionStatus =
  | "pending"
  | "processing"
  | "coordinated"
  | "failed"
  | "cancelled";

export type CanonicalTISSRuntimeSession = {
  kind: "canonical-tiss-runtime-session";
  runtimeSessionId: string;
  status: TISSRuntimeSessionStatus;
  request?: CanonicalTISSRequest;
  result?: CanonicalTISSResult;
  metadata?: CanonicalTISSMetadata;
  profileReference?: CanonicalTISSProfileReference;
  providerReference?: CanonicalTISSProviderReference;
  executionId?: string;
  tissProviderAdapterId?: string;
  processedViaTISSProviderPort: boolean;
  realTissExecuted: boolean;
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
};
