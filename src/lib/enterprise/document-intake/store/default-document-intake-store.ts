/**
 * DefaultDocumentIntakeStore — store in-process padrão (EPC-12).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 */
import type { DocumentIntakeStore, StoredDocumentIntake } from "./document-intake-store";

export const DEFAULT_DOCUMENT_INTAKE_STORE_ID = "default-in-process";

export type DefaultDocumentIntakeStoreOptions = {
  intakes?: readonly StoredDocumentIntake[];
};

export class DefaultDocumentIntakeStore implements DocumentIntakeStore {
  readonly storeId = DEFAULT_DOCUMENT_INTAKE_STORE_ID;

  private readonly intakes = new Map<string, StoredDocumentIntake>();

  constructor(options: DefaultDocumentIntakeStoreOptions = {}) {
    for (const intake of options.intakes ?? []) {
      this.intakes.set(intake.intakeId, intake);
    }
  }

  getIntake(intakeId: string): StoredDocumentIntake | undefined {
    return this.intakes.get(intakeId);
  }

  setIntake(intake: StoredDocumentIntake): void {
    this.intakes.set(intake.intakeId, intake);
  }

  listIntakes(): readonly StoredDocumentIntake[] {
    return [...this.intakes.values()];
  }

  removeIntake(intakeId: string): boolean {
    return this.intakes.delete(intakeId);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultDocumentIntakeStore ready (${this.intakes.size} intakes).`,
    };
  }
}
