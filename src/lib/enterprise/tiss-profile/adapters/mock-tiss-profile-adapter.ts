/**
 * MockTISSProfileAdapter — EPC-22 / FASE 3.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
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
  TISSProfileProviderId,
} from "../ports/types";
import { DefaultTISSProfileStore, type TISSProfileStore } from "../store";

export const MOCK_TISS_PROFILE_ADAPTER_ID = "mock-in-memory";
export const MOCK_TISS_PROFILE_VERSION = "1.0.0";

export type MockTISSProfileAdapterOptions = {
  provider?: Extract<TISSProfileProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: TISSProfileStore;
  createId?: () => string;
  createVersionId?: () => string;
  createRelationshipId?: () => string;
  createMetadataId?: () => string;
  now?: () => string;
};

export class MockTISSProfileAdapter implements TISSProfilePort {
  readonly providerId: Extract<TISSProfileProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: TISSProfileStore;
  private readonly createId: () => string;
  private readonly createVersionId: () => string;
  private readonly createRelationshipId: () => string;
  private readonly createMetadataId: () => string;
  private readonly now?: () => string;

  constructor(options: MockTISSProfileAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} tiss-profile ready.`;
    this.store = options.store ?? new DefaultTISSProfileStore();
    this.createId = options.createId ?? createTISSProfileId;
    this.createVersionId = options.createVersionId ?? createProfileVersionId;
    this.createRelationshipId = options.createRelationshipId ?? createProfileRelationshipId;
    this.createMetadataId = options.createMetadataId ?? createProfileMetadataId;
    this.now = options.now;
  }

  getStore(): TISSProfileStore {
    return this.store;
  }

  capabilities(): TISSProfileCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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

  async health(): Promise<TISSProfileHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedProfileCount: this.store.profileCount(),
      storedVersionCount: this.store.versionCount(),
      storedRelationshipCount: this.store.relationshipCount(),
      storedMetadataCount: this.store.metadataCount(),
    };
  }

  async registerProfile(input: RegisterProfileInput): Promise<RegisterProfileResult> {
    if (!this.healthy) {
      return { ok: false, code: "unhealthy", message: this.message };
    }

    const stamp = this.now?.() ?? new Date().toISOString();
    const id = input.profile.id || this.createId();
    const existing = this.store.getProfile(id);

    const versionIds = [...(input.profile.versionIds ?? [])];
    let metadataId = input.profile.metadataId;

    const embeddedRelationships = input.relationships ?? input.profile.relationships ?? [];
    const persistedRelationships: ProfileRelationship[] = [];
    for (const relationship of embeddedRelationships) {
      const relationshipId = relationship.id || this.createRelationshipId();
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
    }

    const versions = input.versions ?? [];
    for (const version of versions) {
      const versionId = version.id || this.createVersionId();
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
      metadataId = metadataInput.id || this.createMetadataId();
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
    if (!this.healthy) {
      return { ok: false, code: "unhealthy", message: this.message };
    }

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
    if (!this.healthy) {
      return { ok: false, profiles: [], code: "unhealthy", message: this.message };
    }

    const profiles = this.store.listProfiles().filter((profile) => {
      if (input.status != null && profile.status !== input.status) return false;
      if (input.tag != null && !(profile.tags ?? []).includes(input.tag)) return false;
      if (
        input.profileCodePrefix != null &&
        !profile.profileCode.startsWith(input.profileCodePrefix)
      ) {
        return false;
      }
      if (input.namePrefix != null && !profile.name.startsWith(input.namePrefix)) return false;
      if (input.versionFamily != null) {
        const families = profile.supportedVersionFamilies ?? [];
        if (!families.includes(input.versionFamily)) return false;
      }
      return true;
    });
    return { ok: true, profiles, code: "listed" };
  }
}
