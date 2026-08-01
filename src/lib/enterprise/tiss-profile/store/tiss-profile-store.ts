/**
 * TISSProfileStore — contrato interno do store (EPC-22).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO conhece parsers / regras / contratos.
 */
import type {
  ProfileMetadata,
  ProfileRelationship,
  ProfileVersion,
  TISSProfile,
} from "../ports/models";

export type StoredTISSProfile = TISSProfile;
export type StoredProfileVersion = ProfileVersion;
export type StoredProfileRelationship = ProfileRelationship;
export type StoredProfileMetadata = ProfileMetadata;

export interface TISSProfileStore {
  readonly storeId: string;

  getProfile(profileId: string): StoredTISSProfile | undefined;
  getProfileByCode(profileCode: string): StoredTISSProfile | undefined;
  getProfileByName(name: string): StoredTISSProfile | undefined;
  setProfile(profile: StoredTISSProfile): void;
  listProfiles(): readonly StoredTISSProfile[];
  removeProfile(profileId: string): boolean;
  profileCount(): number;

  getVersion(versionId: string): StoredProfileVersion | undefined;
  setVersion(version: StoredProfileVersion): void;
  listVersions(): readonly StoredProfileVersion[];
  listVersionsByProfile(profileId: string): readonly StoredProfileVersion[];
  removeVersion(versionId: string): boolean;
  versionCount(): number;

  getRelationship(relationshipId: string): StoredProfileRelationship | undefined;
  setRelationship(relationship: StoredProfileRelationship): void;
  listRelationships(): readonly StoredProfileRelationship[];
  listRelationshipsByProfile(profileId: string): readonly StoredProfileRelationship[];
  removeRelationship(relationshipId: string): boolean;
  relationshipCount(): number;

  getMetadata(metadataId: string): StoredProfileMetadata | undefined;
  setMetadata(metadata: StoredProfileMetadata): void;
  listMetadata(): readonly StoredProfileMetadata[];
  removeMetadata(metadataId: string): boolean;
  metadataCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
