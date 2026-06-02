/**
 * Planejador: expande cadeia supervisionada em passos (gate → simulação → execução) com dependências.
 */
import { expectUuid } from "@/lib/domain/operations/validation";
import { ValidationError } from "@/lib/domain/operations/errors";
import type {
  CreateOperationalOrchestrationInput,
  OrchestrationChainItemInput,
  OrchestrationPolicyBundle,
  PlannedOrchestrationStep,
} from "./types";
import { mergePolicy, validateExpandedPlanAgainstPolicy } from "./policy-engine";

function normalizeChainItem(
  index: number,
  item: OrchestrationChainItemInput,
  chainLength: number,
): {
  proposalId: string;
  dependsOnItemIndex: number | null;
  flags: Required<
    Pick<
      OrchestrationChainItemInput,
      "includeProposalGate" | "includeSimulation" | "includeExecution"
    >
  >;
} {
  const proposalId = expectUuid(item.proposalId, `chain[${index}].proposalId`);
  let dependsOnItemIndex: number | null;
  if (item.dependsOnItemIndex === undefined || item.dependsOnItemIndex === null) {
    dependsOnItemIndex = index === 0 ? null : index - 1;
  } else {
    dependsOnItemIndex = item.dependsOnItemIndex;
    if (dependsOnItemIndex < 0 || dependsOnItemIndex >= chainLength) {
      throw new ValidationError(`dependsOnItemIndex inválido em chain[${index}].`);
    }
  }
  const includeProposalGate = item.includeProposalGate !== false;
  const includeSimulation = item.includeSimulation !== false;
  const includeExecution = item.includeExecution !== false;
  if (includeExecution && !includeSimulation) {
    throw new ValidationError(
      `chain[${index}]: execução exige simulação habilitada (política de segurança).`,
    );
  }
  return {
    proposalId,
    dependsOnItemIndex,
    flags: { includeProposalGate, includeSimulation, includeExecution },
  };
}

/**
 * Expande cada item da cadeia em até 3 passos com dependências internas e entre itens.
 * Ordem global de ordinais: crescente conforme expansão.
 */
export function buildPlannedStepsFromChain(
  input: CreateOperationalOrchestrationInput,
  policyOverrides?: Partial<OrchestrationPolicyBundle>,
): { policy: OrchestrationPolicyBundle; steps: PlannedOrchestrationStep[] } {
  const policy = mergePolicy(policyOverrides);
  if (!input.title.trim()) throw new ValidationError("title é obrigatório.");
  if (!input.chain.length) throw new ValidationError("Informe ao menos um item na cadeia.");
  if (input.chain.length > policy.maxChainItems) {
    throw new ValidationError(`Cadeia excede maxChainItems (${policy.maxChainItems}).`);
  }

  const normalized = input.chain.map((c, i) => normalizeChainItem(i, c, input.chain.length));

  const steps: PlannedOrchestrationStep[] = [];
  /** Mapeia (itemIndex, 'gate'|'sim'|'exec') → ordinal */
  const ordinalOf = new Map<string, number>();

  for (let itemIndex = 0; itemIndex < normalized.length; itemIndex++) {
    const item = normalized[itemIndex]!;
    const { proposalId, dependsOnItemIndex, flags } = item;

    const crossDeps: number[] = [];
    if (dependsOnItemIndex !== null) {
      const prevExecKey = `${dependsOnItemIndex}:exec`;
      const prevOrd = ordinalOf.get(prevExecKey);
      if (prevOrd === undefined) {
        throw new ValidationError(
          `Item ${itemIndex} depende do item ${dependsOnItemIndex}, mas não há execução anterior indexável.`,
        );
      }
      crossDeps.push(prevOrd);
    }

    let lastOrdinal: number | null = null;

    if (flags.includeProposalGate) {
      const ord = steps.length;
      const depends = [...crossDeps];
      if (lastOrdinal !== null) depends.push(lastOrdinal);
      steps.push({
        ordinal: ord,
        stepKind: "proposal_gate",
        dependsOnOrdinals: depends,
        proposalId,
        rationale: `Portão de governança da proposta antes de simular (item ${itemIndex + 1}/${normalized.length}).`,
      });
      ordinalOf.set(`${itemIndex}:gate`, ord);
      lastOrdinal = ord;
    }

    if (flags.includeSimulation) {
      const ord = steps.length;
      const depends: number[] = [...crossDeps];
      if (lastOrdinal !== null) depends.push(lastOrdinal);
      steps.push({
        ordinal: ord,
        stepKind: "sandbox_simulation",
        dependsOnOrdinals: depends,
        proposalId,
        rationale: `Simulação sandbox supervisionada (item ${itemIndex + 1}/${normalized.length}).`,
      });
      ordinalOf.set(`${itemIndex}:sim`, ord);
      lastOrdinal = ord;
    }

    if (flags.includeExecution) {
      const ord = steps.length;
      const depends: number[] = [...crossDeps];
      if (lastOrdinal !== null) depends.push(lastOrdinal);
      steps.push({
        ordinal: ord,
        stepKind: "supervised_execution",
        dependsOnOrdinals: depends,
        proposalId,
        rationale: `Execução supervisionada de mutações (item ${itemIndex + 1}/${normalized.length}).`,
      });
      ordinalOf.set(`${itemIndex}:exec`, ord);
      lastOrdinal = ord;
    }

    if (lastOrdinal === null) {
      throw new ValidationError(
        `Item ${itemIndex}: nenhum passo gerado — habilite portão, simulação ou execução.`,
      );
    }
  }

  validateExpandedPlanAgainstPolicy(steps, policy);
  return { policy, steps };
}
