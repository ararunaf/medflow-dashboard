/**
 * DefaultTISSProfileAdapter — adapter default in-memory (EPC-22 / FASE 2).
 *
 * Implementação totalmente in-memory.
 * Sem parser XML. Sem validação. Sem regras. Sem banco. Sem OCR/AI/Workflow.
 */
import {
  createProfileMetadataId,
  createProfileRelationshipId,
  createProfileVersionId,
  createTISSProfileId,
} from "../ports/identity";
import type { TISSProfilePort } from "../ports/tiss-profile-port";
import type {
  ProfileMetadata,
  ProfileRelationship,
  ProfileVersion,
  TISSProfile,
} from "../ports/models";
import type {
  GetProfileInput,
  GetProfileResult,
  ListProfilesInput,
  ListProfilesResult,
  RegisterProfileInput,
  RegisterProfileResult,
  TISSProfileCapabilities,
  TISSProfileHealth,
} from "../ports/types";
import { DefaultTISSProfileStore, type TISSProfileStore } from "../store";

export const DEFAULT_TISS_PROFILE_ADAPTER_ID = "default-in-process";
export const DEFAULT_TISS_PROFILE_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultTISSProfileRuntime = {
  /** Store ativo. Default: DefaultTISSProfileStore in-process. */
  store?: TISSProfileStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de id injetável (testes). */
  createId?: () => string;
  createVersionId?: () => string;
  createRelationshipId?: () => string;
  createMetadataId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultTISSProfileRuntime {
  return {
    store: new DefaultTISSProfileStore(),
  };
}

function nowIso(runtime: DefaultTISSProfileRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

function foundationCapabilities(provider: "default", adapterId: string): TISSProfileCapabilities {
  return {
    provider,
    adapterId,
    supportsRegisterProfile: true,
    supportsGetProfile: true,
    supportsListProfiles: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsStructuralDocumentPattern: true,
    supportsMandatoryOptionalConcepts: true,
    supportsCardinality: true,
    supportsExpectedRelationships: true,
    supportsLogicalOrder: true,
    supportsStructuralNotes: true,
    supportsMultiVersionTiss: true,
    supportsFutureTissMapping: true,
    supportsFutureHealthcareModel: true,
    supportsFutureRuleEngine: true,
    supportsFutureAiAuditor: true,
    supportsFutureOcr: true,
    supportsFutureFhir: true,
    supportsFutureDicom: true,
    implementsXmlParser: false,
    implementsValidation: false,
    implementsRules: false,
    implementsRuleEngine: false,
    implementsWorkflow: false,
    implementsOcr: false,
    implementsAi: false,
    implementsContracts: false,
    knowsOperatorOrCooperative: false,
    representsDocumentStructureOnly: true,
  };
}

function storeCounts(store: TISSProfileStore) {
  return {
    storedProfileCount: store.profileCount(),
    storedVersionCount: store.versionCount(),
    storedRelationshipCount: store.relationshipCount(),
    storedMetadataCount: store.metadataCount(),
  };
}

export class DefaultTISSProfileAdapter implements TISSProfilePort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultTISSProfileRuntime;
  private readonly store: TISSProfileStore;

  constructor(runtime: DefaultTISSProfileRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultTISSProfileStore();
  }

  /** Acesso estrutural ao store (testes / demo). */
  getStore(): TISSProfileStore {
    return this.store;
  }

  capabilities(): TISSProfileCapabilities {
    return foundationCapabilities("default", DEFAULT_TISS_PROFILE_ADAPTER_ID);
  }

  async health(): Promise<TISSProfileHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok ? "Default tiss-profile probe ok." : "Default tiss-profile probe falhou."),
        ...storeCounts(this.store),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message: storeHealth.message ?? "DefaultTISSProfileStore pronto (sem I/O externo — EPC-22).",
      ...storeCounts(this.store),
    };
  }

  async registerProfile(input: RegisterProfileInput): Promise<RegisterProfileResult> {
    const stamp = nowIso(this.runtime);
    const id = input.profile.id || this.runtime.createId?.() || createTISSProfileId();
    const existing = this.store.getProfile(id);

    const versionIds = [...(input.profile.versionIds ?? [])];
    const relationshipIds: string[] = [];
    let metadataId = input.profile.metadataId;

    const embeddedRelationships = input.relationships ?? input.profile.relationships ?? [];
    const persistedRelationships: ProfileRelationship[] = [];
    for (const relationship of embeddedRelationships) {
      const relationshipId =
        relationship.id || this.runtime.createRelationshipId?.() || createProfileRelationshipId();
      const stored: ProfileRelationship = {
        ...relationship,
        kind: "profile-relationship",
        id: relationshipId,
        profileId: id,
        createdAt: relationship.createdAt ?? stamp,
        updatedAt: stamp,
        status: relationship.status ?? "draft",
        version: relationship.version ?? "1",
      };
      this.store.setRelationship(stored);
      persistedRelationships.push(stored);
      relationshipIds.push(relationshipId);
    }

    const versions = input.versions ?? [];
    for (const version of versions) {
      const versionId = version.id || this.runtime.createVersionId?.() || createProfileVersionId();
      const stored: ProfileVersion = {
        ...version,
        kind: "profile-version",
        id: versionId,
        profileId: id,
        createdAt: version.createdAt ?? stamp,
        updatedAt: stamp,
        status: version.status ?? "draft",
        version: version.version ?? "1",
      };
      this.store.setVersion(stored);
      if (!versionIds.includes(versionId)) {
        versionIds.push(versionId);
      }
    }

    const metadataInput = input.metadata ?? input.profile.metadata;
    let metadata: ProfileMetadata | undefined;
    if (metadataInput) {
      metadataId =
        metadataInput.id || this.runtime.createMetadataId?.() || createProfileMetadataId();
      metadata = {
        ...metadataInput,
        kind: "profile-metadata",
        id: metadataId,
        profileId: id,
        createdAt: metadataInput.createdAt ?? stamp,
        updatedAt: stamp,
        status: metadataInput.status ?? "draft",
        version: metadataInput.version ?? "1",
      };
      this.store.setMetadata(metadata);
    }

    const profile: TISSProfile = {
      ...input.profile,
      kind: "profile",
      id,
      relationships:
        persistedRelationships.length > 0 ? persistedRelationships : input.profile.relationships,
      versionIds: versionIds.length > 0 ? versionIds : input.profile.versionIds,
      metadataId,
      metadata,
      createdAt: existing?.createdAt ?? input.profile.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.profile.status ?? existing?.status ?? "draft",
      version: input.profile.version ?? existing?.version ?? "1",
    };

    this.store.setProfile(profile);
    return {
      ok: true,
      profileId: id,
      profile,
      code: existing ? "updated" : "created",
      message: existing ? "profile updated" : "profile registered",
    };
  }

  async getProfile(input: GetProfileInput): Promise<GetProfileResult> {
    let profile: TISSProfile | undefined;

    if (input.profileId) {
      profile = this.store.getProfile(input.profileId);
    } else if (input.profileCode) {
      profile = this.store.getProfileByCode(input.profileCode);
    } else if (input.name) {
      profile = this.store.getProfileByName(input.name);
    } else {
      return {
        ok: false,
        code: "invalid_input",
        message: "profileId, profileCode or name required",
      };
    }

    if (!profile) {
      return { ok: false, code: "not_found", message: "not found" };
    }
    return { ok: true, profile, code: "found" };
  }

  async listProfiles(input: ListProfilesInput = {}): Promise<ListProfilesResult> {
    const profiles = this.store.listProfiles().filter((profile) => matchesList(profile, input));
    return { ok: true, profiles, code: "listed" };
  }
}

function matchesList(profile: TISSProfile, input: ListProfilesInput): boolean {
  if (input.status != null && profile.status !== input.status) return false;
  if (input.tag != null && !(profile.tags ?? []).includes(input.tag)) return false;
  if (input.profileCodePrefix != null && !profile.profileCode.startsWith(input.profileCodePrefix)) {
    return false;
  }
  if (input.namePrefix != null && !profile.name.startsWith(input.namePrefix)) return false;
  if (input.versionFamily != null) {
    const families = profile.supportedVersionFamilies ?? [];
    if (!families.includes(input.versionFamily)) return false;
  }
  return true;
}
