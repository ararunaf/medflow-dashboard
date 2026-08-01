/**
 * DefaultTISSProfileStore — store in-process padrão (EPC-22).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type {
  StoredProfileMetadata,
  StoredProfileRelationship,
  StoredProfileVersion,
  StoredTISSProfile,
  TISSProfileStore,
} from "./tiss-profile-store";

export const DEFAULT_TISS_PROFILE_STORE_ID = "default-in-process";

export type DefaultTISSProfileStoreOptions = {
  profiles?: readonly StoredTISSProfile[];
  versions?: readonly StoredProfileVersion[];
  relationships?: readonly StoredProfileRelationship[];
  metadata?: readonly StoredProfileMetadata[];
};

export class DefaultTISSProfileStore implements TISSProfileStore {
  readonly storeId = DEFAULT_TISS_PROFILE_STORE_ID;

  private readonly profiles = new Map<string, StoredTISSProfile>();
  private readonly profilesByCode = new Map<string, string>();
  private readonly profilesByName = new Map<string, string>();
  private readonly versions = new Map<string, StoredProfileVersion>();
  private readonly relationships = new Map<string, StoredProfileRelationship>();
  private readonly metadata = new Map<string, StoredProfileMetadata>();

  constructor(options: DefaultTISSProfileStoreOptions = {}) {
    for (const profile of options.profiles ?? []) {
      this.setProfile(profile);
    }
    for (const version of options.versions ?? []) {
      this.versions.set(version.id, version);
    }
    for (const relationship of options.relationships ?? []) {
      this.relationships.set(relationship.id, relationship);
    }
    for (const meta of options.metadata ?? []) {
      this.metadata.set(meta.id, meta);
    }
  }

  getProfile(profileId: string): StoredTISSProfile | undefined {
    return this.profiles.get(profileId);
  }

  getProfileByCode(profileCode: string): StoredTISSProfile | undefined {
    const id = this.profilesByCode.get(profileCode);
    return id ? this.profiles.get(id) : undefined;
  }

  getProfileByName(name: string): StoredTISSProfile | undefined {
    const id = this.profilesByName.get(name);
    return id ? this.profiles.get(id) : undefined;
  }

  setProfile(profile: StoredTISSProfile): void {
    const previous = this.profiles.get(profile.id);
    if (previous) {
      if (previous.profileCode !== profile.profileCode) {
        this.profilesByCode.delete(previous.profileCode);
      }
      if (previous.name !== profile.name) {
        this.profilesByName.delete(previous.name);
      }
    }
    this.profiles.set(profile.id, profile);
    this.profilesByCode.set(profile.profileCode, profile.id);
    this.profilesByName.set(profile.name, profile.id);
  }

  listProfiles(): readonly StoredTISSProfile[] {
    return [...this.profiles.values()];
  }

  removeProfile(profileId: string): boolean {
    const existing = this.profiles.get(profileId);
    if (!existing) return false;
    this.profilesByCode.delete(existing.profileCode);
    this.profilesByName.delete(existing.name);
    return this.profiles.delete(profileId);
  }

  profileCount(): number {
    return this.profiles.size;
  }

  getVersion(versionId: string): StoredProfileVersion | undefined {
    return this.versions.get(versionId);
  }

  setVersion(version: StoredProfileVersion): void {
    this.versions.set(version.id, version);
  }

  listVersions(): readonly StoredProfileVersion[] {
    return [...this.versions.values()];
  }

  listVersionsByProfile(profileId: string): readonly StoredProfileVersion[] {
    return [...this.versions.values()].filter((version) => version.profileId === profileId);
  }

  removeVersion(versionId: string): boolean {
    return this.versions.delete(versionId);
  }

  versionCount(): number {
    return this.versions.size;
  }

  getRelationship(relationshipId: string): StoredProfileRelationship | undefined {
    return this.relationships.get(relationshipId);
  }

  setRelationship(relationship: StoredProfileRelationship): void {
    this.relationships.set(relationship.id, relationship);
  }

  listRelationships(): readonly StoredProfileRelationship[] {
    return [...this.relationships.values()];
  }

  listRelationshipsByProfile(profileId: string): readonly StoredProfileRelationship[] {
    return [...this.relationships.values()].filter(
      (relationship) => relationship.profileId === profileId,
    );
  }

  removeRelationship(relationshipId: string): boolean {
    return this.relationships.delete(relationshipId);
  }

  relationshipCount(): number {
    return this.relationships.size;
  }

  getMetadata(metadataId: string): StoredProfileMetadata | undefined {
    return this.metadata.get(metadataId);
  }

  setMetadata(metadata: StoredProfileMetadata): void {
    this.metadata.set(metadata.id, metadata);
  }

  listMetadata(): readonly StoredProfileMetadata[] {
    return [...this.metadata.values()];
  }

  removeMetadata(metadataId: string): boolean {
    return this.metadata.delete(metadataId);
  }

  metadataCount(): number {
    return this.metadata.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultTISSProfileStore ready (${this.profiles.size} profiles, ${this.versions.size} versions, ${this.relationships.size} relationships, ${this.metadata.size} metadata).`,
    };
  }
}
