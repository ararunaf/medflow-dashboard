/**
 * Helpers de versionamento — EPC-09 FASE 7.
 *
 * Preparação estrutural apenas. Sem persistência real.
 * Sem conhecimento clínico, TISS ou contratual.
 */
import type {
  RulePack,
  RulePackCompatibility,
  RulePackLifecycle,
  RulePackVersion,
  RulePackVersionInfo,
} from "./types";

/** Extrai o bloco de versionamento de um pack. */
export function getVersionInfo(pack: RulePack): RulePackVersionInfo {
  return {
    version: pack.version,
    previousVersion: pack.previousVersion,
    nextVersion: pack.nextVersion,
    compatibility: pack.compatibility,
    lifecycle: pack.lifecycle,
  };
}

/** Aplica campos de versionamento sem mutar o original. */
export function withVersionInfo(pack: RulePack, info: Partial<RulePackVersionInfo>): RulePack {
  return {
    ...pack,
    version: info.version ?? pack.version,
    previousVersion: info.previousVersion ?? pack.previousVersion,
    nextVersion: info.nextVersion ?? pack.nextVersion,
    compatibility: info.compatibility ?? pack.compatibility,
    lifecycle: info.lifecycle ?? pack.lifecycle,
  };
}

/** Define cadeia previous → current → next (estrutural). */
export function defineVersionChain(options: {
  version: RulePackVersion;
  previousVersion?: RulePackVersion;
  nextVersion?: RulePackVersion;
  compatibility?: RulePackCompatibility;
  lifecycle?: RulePackLifecycle;
}): RulePackVersionInfo {
  return {
    version: options.version,
    previousVersion: options.previousVersion,
    nextVersion: options.nextVersion,
    compatibility: options.compatibility,
    lifecycle: options.lifecycle,
  };
}

/** True se o pack declara lifecycle conhecido. */
export function hasLifecycle(pack: RulePack): boolean {
  return pack.lifecycle != null && pack.lifecycle !== "";
}

/** True se há cadeia de versões (previous ou next). */
export function hasVersionChain(pack: RulePack): boolean {
  return pack.previousVersion != null || pack.nextVersion != null;
}
