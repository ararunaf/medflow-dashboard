/**
 * Helpers de SourceType — EPC-12 FASE 7.
 *
 * Somente enumeração / inspeção estrutural. Sem lógica de captura,
 * upload, watcher, scanner, e-mail ou I/O.
 */
import type { DocumentIntake, SourceType } from "./types";
import { SOURCE_TYPES } from "./types";

/** True se o SourceType é um dos conhecidos (FASE 7). */
export function hasKnownSourceType(sourceType: SourceType): boolean {
  return (SOURCE_TYPES as readonly string[]).includes(sourceType);
}

/** True se o intake declara um SourceType conhecido. */
export function intakeHasKnownSourceType(intake: DocumentIntake): boolean {
  return hasKnownSourceType(intake.sourceType);
}

/** Lista os SourceTypes canônicos (cópia estrutural). */
export function listSourceTypes(): readonly SourceType[] {
  return [...SOURCE_TYPES];
}
