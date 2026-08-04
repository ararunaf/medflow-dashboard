/**
 * ScannerRuntimeStore — contrato interno do store (F3-CAP-01).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO abre drivers; NÃO captura; NÃO enumera hardware.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalScanner,
  CanonicalScannerAcquisition,
  CanonicalScannerSession,
  CanonicalScannerStatistics,
} from "../ports/canonical";

export type StoredCanonicalScanner = CanonicalScanner;
export type StoredCanonicalScannerSession = CanonicalScannerSession;
export type StoredCanonicalScannerAcquisition = CanonicalScannerAcquisition;

export interface ScannerRuntimeStore {
  readonly storeId: string;

  getScanner(scannerId: string): StoredCanonicalScanner | undefined;
  getScannerByName(scannerName: string): StoredCanonicalScanner | undefined;
  setScanner(scanner: StoredCanonicalScanner): void;
  removeScanner(scannerId: string): void;
  listScanners(): readonly StoredCanonicalScanner[];

  getSession(sessionId: string): StoredCanonicalScannerSession | undefined;
  setSession(session: StoredCanonicalScannerSession): void;
  listSessions(scannerId?: string): readonly StoredCanonicalScannerSession[];

  getAcquisition(acquisitionId: string): StoredCanonicalScannerAcquisition | undefined;
  setAcquisition(acquisition: StoredCanonicalScannerAcquisition): void;
  listAcquisitions(scannerId?: string): readonly StoredCanonicalScannerAcquisition[];

  scannerCount(): number;
  sessionCount(): number;
  acquisitionCount(): number;
  statistics(): CanonicalScannerStatistics;
  health(): { ok: boolean; message?: string };
}
