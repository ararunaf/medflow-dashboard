import type { CanonicalTISSRuntimeSession } from "../ports/models";

export type StoredTISSRuntimeSession = CanonicalTISSRuntimeSession;

export interface TISSRuntimeStore {
  readonly storeId: string;
  getSession(runtimeSessionId: string): StoredTISSRuntimeSession | undefined;
  setSession(session: StoredTISSRuntimeSession): void;
  listSessions(): readonly StoredTISSRuntimeSession[];
  removeSession(runtimeSessionId: string): boolean;
  sessionCount(): number;
  health(): { ok: boolean; message?: string };
}
