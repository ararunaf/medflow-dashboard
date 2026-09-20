/**
 * SEC-PII-02 — criptografia de conteúdo em repouso dos artefatos do
 * pipeline de captura (AES-256-GCM).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  decryptStorageBytes,
  encryptStorageBytes,
  isStorageEncryptionConfigured,
} from "../../../src/lib/security/storage-encryption.ts";

const TEST_KEY_HEX = "0".repeat(63) + "1"; // 32 bytes válidos, determinístico para teste

/** Node's assert.deepEqual treats Buffer/Uint8Array as different types even with identical bytes. */
function assertBytesEqual(actual: Uint8Array, expected: Uint8Array, message?: string): void {
  assert.equal(Buffer.compare(Buffer.from(actual), Buffer.from(expected)), 0, message);
}

function withKey<T>(key: string | undefined, run: () => T): T {
  const original = process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY;
  if (key === undefined) delete process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY;
  else process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY = key;
  try {
    return run();
  } finally {
    if (original === undefined) delete process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY;
    else process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY = original;
  }
}

describe("storage-encryption — SEC-PII-02", () => {
  it("round-trip: criptografa e descriptografa de volta ao texto original", () => {
    withKey(TEST_KEY_HEX, () => {
      const plaintext = new TextEncoder().encode(JSON.stringify({ cpf: "123.456.789-00" }));
      const encrypted = encryptStorageBytes(plaintext);
      assert.notEqual(
        Buffer.compare(Buffer.from(encrypted), Buffer.from(plaintext)),
        0,
        "o blob cifrado não pode ser igual ao texto original",
      );
      const decrypted = decryptStorageBytes(encrypted);
      assertBytesEqual(decrypted, plaintext);
    });
  });

  it("duas criptografias do mesmo conteúdo produzem blobs diferentes (IV aleatório)", () => {
    withKey(TEST_KEY_HEX, () => {
      const plaintext = new TextEncoder().encode("mesmo conteúdo");
      const a = encryptStorageBytes(plaintext);
      const b = encryptStorageBytes(plaintext);
      assert.notEqual(Buffer.compare(Buffer.from(a), Buffer.from(b)), 0);
    });
  });

  it("detecta adulteração — decriptar um blob cifrado alterado falha (GCM auth tag)", () => {
    withKey(TEST_KEY_HEX, () => {
      const encrypted = encryptStorageBytes(new TextEncoder().encode("dado sensível"));
      const tampered = new Uint8Array(encrypted);
      tampered[tampered.length - 1] ^= 0xff;
      assert.throws(() => decryptStorageBytes(tampered));
    });
  });

  it("blob legado (sem o marker) passa direto por decryptStorageBytes, sem exigir chave", () => {
    withKey(undefined, () => {
      const legacyPlaintext = new TextEncoder().encode(JSON.stringify({ old: true }));
      const result = decryptStorageBytes(legacyPlaintext);
      assertBytesEqual(result, legacyPlaintext);
    });
  });

  it("fail-closed: encryptStorageBytes lança se a chave não estiver configurada", () => {
    withKey(undefined, () => {
      assert.throws(() => encryptStorageBytes(new TextEncoder().encode("x")), /não configurada/);
    });
  });

  it("chave em base64 (32 bytes) também funciona", () => {
    const base64Key = Buffer.from(randomBytes(32)).toString("base64");
    withKey(base64Key, () => {
      const plaintext = new TextEncoder().encode("base64 key works");
      assertBytesEqual(decryptStorageBytes(encryptStorageBytes(plaintext)), plaintext);
    });
  });

  it("chave com tamanho errado lança erro claro", () => {
    withKey("deadbeef", () => {
      assert.throws(() => encryptStorageBytes(new TextEncoder().encode("x")), /32 bytes/);
    });
  });

  it("isStorageEncryptionConfigured reflete a presença da variável", () => {
    withKey(undefined, () => {
      assert.equal(isStorageEncryptionConfigured(), false);
    });
    withKey(TEST_KEY_HEX, () => {
      assert.equal(isStorageEncryptionConfigured(), true);
    });
  });
});
