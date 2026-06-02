/**
 * Geradores de rollback preview hipotéticos.
 *
 * Para cada `SimulatedMutation`, calcula o passo reverso correspondente em
 * linguagem natural — útil para o coordenador entender, antes da execução
 * real (futura), qual é a "saída de emergência" de uma operação.
 */
import type {
  RollbackPreviewStep,
  SimulatedMutation,
  SimulatedMutationDirection,
} from "@/lib/operations/execution-sandbox/types";

function inverseDirection(d: SimulatedMutationDirection): SimulatedMutationDirection {
  if (d === "create") return "soft_cancel";
  if (d === "soft_cancel") return "create";
  if (d === "update") return "update";
  return "notify"; // notify → notify (não há reverso operacional)
}

function describeReverse(m: SimulatedMutation): string {
  switch (m.direction) {
    case "create":
      return `Cancelar a entidade que seria criada em ${m.targetTable}.`;
    case "soft_cancel":
      return `Reverter o cancelamento simulado na entidade alvo de ${m.targetTable}.`;
    case "update":
      return `Restaurar o estado anterior do registro em ${m.targetTable}.`;
    case "notify":
      return "Emitir contra-notificação esclarecendo que a ação anterior era hipotética.";
    default:
      return "Reversão não definida — operação informativa.";
  }
}

function isTriviallyReversible(m: SimulatedMutation): boolean {
  if (m.direction === "create" || m.direction === "soft_cancel") return true;
  if (m.direction === "notify") return true;
  // updates podem ter cascata — não consideramos triviais por padrão.
  return false;
}

/** Gera o preview ordenado (mesma ordem das mutações). */
export function buildRollbackPreview(
  mutations: readonly SimulatedMutation[],
): RollbackPreviewStep[] {
  return mutations.map((m) => ({
    mutationId: m.id,
    describe: describeReverse(m),
    inverseDirection: inverseDirection(m.direction),
    trivialReverse: isTriviallyReversible(m),
  }));
}
