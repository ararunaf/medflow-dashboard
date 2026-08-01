/**
 * Helpers de identidade — EPC-24 Sprint 04 (Execution State Machine).
 *
 * Sem OCR, IA, parsers ou conhecimento clínico / TISS.
 */

let stateMachineIdSeq = 0;
let stateIdSeq = 0;
let transitionIdSeq = 0;
let historyIdSeq = 0;
let ruleIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createStateMachineId(): string {
  stateMachineIdSeq += 1;
  return next("execution-state-machine", stateMachineIdSeq);
}

export function createStateId(): string {
  stateIdSeq += 1;
  return next("execution-state", stateIdSeq);
}

export function createTransitionId(): string {
  transitionIdSeq += 1;
  return next("execution-state-transition", transitionIdSeq);
}

export function createHistoryId(): string {
  historyIdSeq += 1;
  return next("execution-state-history", historyIdSeq);
}

export function createTransitionRuleId(): string {
  ruleIdSeq += 1;
  return next("execution-transition-rule", ruleIdSeq);
}

export function resetStateMachineIdSequence(): void {
  stateMachineIdSeq = 0;
}

export function resetStateIdSequence(): void {
  stateIdSeq = 0;
}

export function resetTransitionIdSequence(): void {
  transitionIdSeq = 0;
}

export function resetHistoryIdSequence(): void {
  historyIdSeq = 0;
}

export function resetTransitionRuleIdSequence(): void {
  ruleIdSeq = 0;
}

export function resetAllExecutionStateMachineIdSequences(): void {
  resetStateMachineIdSequence();
  resetStateIdSequence();
  resetTransitionIdSequence();
  resetHistoryIdSequence();
  resetTransitionRuleIdSequence();
}
