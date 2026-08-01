/**
 * Helpers de ciclo de vida — EPC-12 FASE 8.
 *
 * Preparação estrutural apenas. Sem implementação operacional.
 * Estados: RECEIVED | QUEUED | READY | PROCESSING | COMPLETED | FAILED | ARCHIVED.
 * Sem fila real. Sem processamento. Sem arquivamento operacional.
 */
import type { DocumentIntake, IntakePriority, IntakeStatus } from "./types";
import { INTAKE_PRIORITIES, INTAKE_STATUSES } from "./types";

/** True se o status é um dos lifecycle conhecidos (FASE 8). */
export function hasKnownStatus(intake: DocumentIntake): boolean {
  return (INTAKE_STATUSES as readonly string[]).includes(intake.status);
}

/** True se a prioridade é uma das conhecidas. */
export function hasKnownPriority(intake: DocumentIntake): boolean {
  if (intake.priority == null) return false;
  return (INTAKE_PRIORITIES as readonly string[]).includes(intake.priority);
}

/** True se o intake está em RECEIVED. */
export function isReceived(intake: DocumentIntake): boolean {
  return intake.status === "RECEIVED";
}

/** True se o intake declara status COMPLETED. */
export function isCompleted(intake: DocumentIntake): boolean {
  return intake.status === "COMPLETED";
}

/** True se o intake declara status FAILED. */
export function isFailed(intake: DocumentIntake): boolean {
  return intake.status === "FAILED";
}

/** True se o intake declara status ARCHIVED. */
export function isArchived(intake: DocumentIntake): boolean {
  return intake.status === "ARCHIVED";
}

/**
 * Aplica rótulo de status / prioridade sem mutar o original (estrutural).
 * NÃO enfileira. NÃO processa. NÃO arquiva operacionalmente.
 */
export function withLifecycle(
  intake: DocumentIntake,
  info: Partial<Pick<DocumentIntake, "status" | "priority">>,
): DocumentIntake {
  return {
    ...intake,
    status: info.status ?? intake.status,
    priority: info.priority ?? intake.priority,
  };
}

/**
 * Prepara transição estrutural de status (rótulo).
 * NÃO executa transição operacional. NÃO altera persistência.
 */
export function prepareStatusTransition(
  intake: DocumentIntake,
  nextStatus: IntakeStatus,
): DocumentIntake {
  return withLifecycle(intake, { status: nextStatus });
}

/**
 * Prepara prioridade estrutural (rótulo).
 * NÃO altera filas reais.
 */
export function preparePriority(intake: DocumentIntake, priority: IntakePriority): DocumentIntake {
  return withLifecycle(intake, { priority });
}
