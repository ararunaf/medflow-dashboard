/**
 * Helpers de dependências entre Packs — EPC-09 FASE 8.
 *
 * Somente infraestrutura. NÃO resolve dependências automaticamente.
 * NÃO carrega packs alvo. NÃO valida grafo ciclico nesta sprint.
 */
import type { PackId, RulePack, RulePackDependency } from "./types";

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createPackId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

/** Define uma dependência estrutural (sem resolução). */
export function defineDependency(
  packId: PackId,
  options: Omit<RulePackDependency, "packId"> = {},
): RulePackDependency {
  return {
    packId,
    ...options,
  };
}

/** Lista PackIds declarados como dependências. */
export function listDependencyPackIds(pack: RulePack): readonly PackId[] {
  return (pack.dependencies ?? []).map((dep) => dep.packId);
}

/** True se o pack declara dependência do alvo. */
export function dependsOn(pack: RulePack, targetPackId: PackId): boolean {
  return (pack.dependencies ?? []).some((dep) => dep.packId === targetPackId);
}

/** Filtra dependências opcionais vs obrigatórias (estrutural). */
export function partitionDependencies(pack: RulePack): {
  required: readonly RulePackDependency[];
  optional: readonly RulePackDependency[];
} {
  const deps = pack.dependencies ?? [];
  return {
    required: deps.filter((dep) => !dep.optional),
    optional: deps.filter((dep) => dep.optional === true),
  };
}

/** Conta dependências declaradas. */
export function getDependencyCount(pack: RulePack): number {
  return (pack.dependencies ?? []).length;
}

/**
 * Verifica se todos os PackIds obrigatórios existem no conjunto fornecido.
 * NÃO carrega packs; apenas compara ids — prep para resolução futura.
 */
export function areRequiredDependenciesPresent(
  pack: RulePack,
  availablePackIds: ReadonlySet<PackId> | readonly PackId[],
): boolean {
  const available = availablePackIds instanceof Set ? availablePackIds : new Set(availablePackIds);
  const { required } = partitionDependencies(pack);
  return required.every((dep) => available.has(dep.packId));
}
