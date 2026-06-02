import { ValidationError } from "@/lib/domain/operations/errors";
import type { SupervisedPolicyLifecycleState } from "@/lib/database.types";

const ORDER: SupervisedPolicyLifecycleState[] = [
  "observed",
  "analyzed",
  "recommended",
  "supervised_review",
  "validated",
];

function rank(s: SupervisedPolicyLifecycleState): number {
  return ORDER.indexOf(s);
}

/**
 * Garante transições supervisionadas apenas para frente (sem reabrir ciclos automaticamente).
 */
export function assertSupervisedPolicyLifecycleTransition(
  from: SupervisedPolicyLifecycleState,
  to: SupervisedPolicyLifecycleState,
): void {
  if (from === to) return;
  if (to === "observed" || to === "analyzed") {
    throw new ValidationError(
      "Transição para estados iniciais não é permitida após materialização.",
      {
        from,
        to,
      },
    );
  }
  const fi = rank(from);
  const ti = rank(to);
  if (fi === -1 || ti === -1) {
    throw new ValidationError("Estado de ciclo de política desconhecido.", { from, to });
  }
  if (ti < fi) {
    throw new ValidationError("Retrocesso de estado exige fluxo administrativo fora desta API.", {
      from,
      to,
    });
  }
}
