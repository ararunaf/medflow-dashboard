/**
 * AIProviderRuntimeStore — contrato interno do store (ARCH-02 / DIP-07).
 */
import type { CanonicalAIInvocationSession } from "../ports/models";

export type StoredAIProviderRuntimeSession = CanonicalAIInvocationSession;

export interface AIProviderRuntimeStore {
  readonly storeId: string;

  getSession(runtimeSessionId: string): StoredAIProviderRuntimeSession | undefined;
  setSession(session: StoredAIProviderRuntimeSession): void;
  listSessions(): readonly StoredAIProviderRuntimeSession[];
  removeSession(runtimeSessionId: string): boolean;
  sessionCount(): number;

  health(): { ok: boolean; message?: string };
}
