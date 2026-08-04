/**
 * InMemoryScannerRuntimeStore — store in-process (F3-CAP-01).
 *
 * Implementação oficial do Scanner Runtime Store.
 * Sem banco. Sem drivers. Sem TWAIN/WIA/ISIS. Sem Scanner real.
 */
import type { CanonicalScannerStatistics } from "../ports/canonical";
import type {
  StoredCanonicalScanner,
  StoredCanonicalScannerAcquisition,
  StoredCanonicalScannerSession,
  ScannerRuntimeStore,
} from "./scanner-runtime-store";

export const IN_MEMORY_SCANNER_RUNTIME_STORE_ID = "in-memory-scanner-runtime";

export type InMemoryScannerRuntimeStoreOptions = {
  scanners?: readonly StoredCanonicalScanner[];
  sessions?: readonly StoredCanonicalScannerSession[];
  acquisitions?: readonly StoredCanonicalScannerAcquisition[];
};

/**
 * Store de Scanners/sessões/aquisições canônicas in-memory — exclusivo do Adapter (F3-CAP-01).
 */
export class InMemoryScannerRuntimeStore implements ScannerRuntimeStore {
  readonly storeId = IN_MEMORY_SCANNER_RUNTIME_STORE_ID;

  private readonly scanners = new Map<string, StoredCanonicalScanner>();
  private readonly byName = new Map<string, string>();
  private readonly sessions = new Map<string, StoredCanonicalScannerSession>();
  private readonly acquisitions = new Map<string, StoredCanonicalScannerAcquisition>();

  constructor(options: InMemoryScannerRuntimeStoreOptions = {}) {
    for (const scanner of options.scanners ?? []) {
      this.setScanner(scanner);
    }
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
    for (const acquisition of options.acquisitions ?? []) {
      this.setAcquisition(acquisition);
    }
  }

  getScanner(scannerId: string): StoredCanonicalScanner | undefined {
    const scanner = this.scanners.get(scannerId);
    return scanner ? { ...scanner } : undefined;
  }

  getScannerByName(scannerName: string): StoredCanonicalScanner | undefined {
    const scannerId = this.byName.get(scannerName);
    if (!scannerId) return undefined;
    return this.getScanner(scannerId);
  }

  setScanner(scanner: StoredCanonicalScanner): void {
    this.scanners.set(scanner.scannerId, { ...scanner });
    this.byName.set(scanner.scannerName, scanner.scannerId);
  }

  removeScanner(scannerId: string): void {
    const existing = this.scanners.get(scannerId);
    if (existing) {
      this.byName.delete(existing.scannerName);
      this.scanners.delete(scannerId);
    }
  }

  listScanners(): readonly StoredCanonicalScanner[] {
    return Array.from(this.scanners.values()).map((scanner) => ({ ...scanner }));
  }

  getSession(sessionId: string): StoredCanonicalScannerSession | undefined {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : undefined;
  }

  setSession(session: StoredCanonicalScannerSession): void {
    this.sessions.set(session.sessionId, { ...session });
  }

  listSessions(scannerId?: string): readonly StoredCanonicalScannerSession[] {
    const all = Array.from(this.sessions.values()).map((session) => ({ ...session }));
    if (!scannerId) return all;
    return all.filter((session) => session.scannerId === scannerId);
  }

  getAcquisition(acquisitionId: string): StoredCanonicalScannerAcquisition | undefined {
    const acquisition = this.acquisitions.get(acquisitionId);
    return acquisition ? { ...acquisition } : undefined;
  }

  setAcquisition(acquisition: StoredCanonicalScannerAcquisition): void {
    this.acquisitions.set(acquisition.acquisitionId, { ...acquisition });
  }

  listAcquisitions(scannerId?: string): readonly StoredCanonicalScannerAcquisition[] {
    const all = Array.from(this.acquisitions.values()).map((acquisition) => ({
      ...acquisition,
    }));
    if (!scannerId) return all;
    return all.filter((acquisition) => acquisition.scannerId === scannerId);
  }

  scannerCount(): number {
    return this.scanners.size;
  }

  sessionCount(): number {
    return this.sessions.size;
  }

  acquisitionCount(): number {
    return this.acquisitions.size;
  }

  statistics(): CanonicalScannerStatistics {
    const all = this.listScanners();
    let registered = 0;
    let discovered = 0;
    for (const scanner of all) {
      if (scanner.status === "registered") registered += 1;
      if (scanner.discovered || scanner.status === "discovered") discovered += 1;
    }
    const sessions = this.listSessions();
    let openSessions = 0;
    let closedSessions = 0;
    for (const session of sessions) {
      if (session.status === "session-open") openSessions += 1;
      if (session.status === "session-closed") closedSessions += 1;
    }
    return {
      kind: "canonical-scanner-statistics",
      totalScanners: all.length,
      registeredScanners: registered,
      discoveredScanners: discovered,
      openSessions,
      closedSessions,
      totalAcquisitions: this.acquisitionCount(),
      scannerImplementedCount: 0,
      twainImplementedCount: 0,
      wiaImplementedCount: 0,
      isisImplementedCount: 0,
      networkScannerImplementedCount: 0,
      driverImplementedCount: 0,
      captureImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Scanner Runtime store ready (${this.scannerCount()} scanners, ${this.sessionCount()} sessions, ${this.acquisitionCount()} acquisitions).`,
    };
  }
}
