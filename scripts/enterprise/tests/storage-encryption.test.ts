/**
 * SEC-PII-02 — criptografia de conteúdo em repouso dos artefatos do
 * pipeline de captura (AES-256-GCM via Web Crypto).
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

async function withKey<T>(key: string | undefined, run: () => Promise<T>): Promise<T> {
  const original = process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY;
  if (key === undefined) delete process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY;
  else process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY = key;
  try {
    return await run();
  } finally {
    if (original === undefined) delete process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY;
    else process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY = original;
  }
}

describe("storage-encryption — SEC-PII-02", () => {
  it("round-trip: criptografa e descriptografa de volta ao texto original", async () => {
    await withKey(TEST_KEY_HEX, async () => {
      const plaintext = new TextEncoder().encode(JSON.stringify({ cpf: "123.456.789-00" }));
      const encrypted = await encryptStorageBytes(plaintext);
      assert.notEqual(
        Buffer.compare(Buffer.from(encrypted), Buffer.from(plaintext)),
        0,
        "o blob cifrado não pode ser igual ao texto original",
      );
      const decrypted = await decryptStorageBytes(encrypted);
      assertBytesEqual(decrypted, plaintext);
    });
  });

  it("duas criptografias do mesmo conteúdo produzem blobs diferentes (IV aleatório)", async () => {
    await withKey(TEST_KEY_HEX, async () => {
      const plaintext = new TextEncoder().encode("mesmo conteúdo");
      const a = await encryptStorageBytes(plaintext);
      const b = await encryptStorageBytes(plaintext);
      assert.notEqual(Buffer.compare(Buffer.from(a), Buffer.from(b)), 0);
    });
  });

  it("detecta adulteração — decriptar um blob cifrado alterado falha (GCM auth tag)", async () => {
    await withKey(TEST_KEY_HEX, async () => {
      const encrypted = await encryptStorageBytes(new TextEncoder().encode("dado sensível"));
      const tampered = new Uint8Array(encrypted);
      tampered[tampered.length - 1] ^= 0xff;
      await assert.rejects(() => decryptStorageBytes(tampered));
    });
  });

  it("blob legado (sem o marker) passa direto por decryptStorageBytes, sem exigir chave", async () => {
    await withKey(undefined, async () => {
      const legacyPlaintext = new TextEncoder().encode(JSON.stringify({ old: true }));
      const result = await decryptStorageBytes(legacyPlaintext);
      assertBytesEqual(result, legacyPlaintext);
    });
  });

  it("fail-closed: encryptStorageBytes lança se a chave não estiver configurada", async () => {
    await withKey(undefined, async () => {
      await assert.rejects(
        () => encryptStorageBytes(new TextEncoder().encode("x")),
        /não configurada/,
      );
    });
  });

  it("chave em base64 (32 bytes) também funciona", async () => {
    const base64Key = Buffer.from(randomBytes(32)).toString("base64");
    await withKey(base64Key, async () => {
      const plaintext = new TextEncoder().encode("base64 key works");
      assertBytesEqual(await decryptStorageBytes(await encryptStorageBytes(plaintext)), plaintext);
    });
  });

  it("chave com tamanho errado lança erro claro", async () => {
    await withKey("deadbeef", async () => {
      await assert.rejects(() => encryptStorageBytes(new TextEncoder().encode("x")), /32 bytes/);
    });
  });

  it("isStorageEncryptionConfigured reflete a presença da variável", async () => {
    await withKey(undefined, async () => {
      assert.equal(isStorageEncryptionConfigured(), false);
    });
    await withKey(TEST_KEY_HEX, async () => {
      assert.equal(isStorageEncryptionConfigured(), true);
    });
  });
});
