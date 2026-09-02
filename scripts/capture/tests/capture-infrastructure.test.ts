#!/usr/bin/env node
/**
 * Testes — pipeline de Captura Inteligente (MEDICFLOW-CAPTURE-PIPELINE-01).
 * Unitários sempre; integração requer Supabase staging (vbfulflzekrnejwetcyr).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CapturePhaseMachine,
  CAPTURE_PHASE_ORDER,
  CAPTURE_TIMELINE_PHASES,
  isValidCapturePhaseTransition,
  assertCapturePhaseTransition,
  nextCapturePhase,
} from "../../../src/modules/capture/services/state-machine.ts";
import {
  buildCaptureEvent,
  appendCaptureEvent,
  eventForDbStatusTransition,
  buildFailedEvent,
} from "../../../src/lib/capture/infrastructure/capture-events.ts";
import {
  buildVersionedObjectKey,
  nextDocumentVersion,
} from "../../../src/lib/capture/infrastructure/versioning.ts";
import {
  buildOriginalObjectKey,
  validateCaptureUpload,
} from "../../../src/lib/capture/infrastructure/storage-paths.ts";
import {
  isValidCaptureTransition,
  POST_UPLOAD_AUTO_STATUSES,
} from "../../../src/lib/capture/state-machine.ts";
import { dbStatusToPhase, phaseToDbStatus } from "../../../src/modules/capture/utils/status-map.ts";
import { formatFileSize, mimeTypeLabel } from "../../../src/modules/capture/utils/file-format.ts";
import { parseCaptureHttpPath } from "../../../src/lib/capture/api/capture-http-router.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

function loadEnv() {
  for (const name of [".env", ".env.local", ".env.staging"]) {
    const path = resolve(root, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

describe("Capture pipeline — domain state machine", () => {
  it("validates linear phase transitions", () => {
    assert.equal(isValidCapturePhaseTransition("idle", "uploading"), true);
    assert.equal(isValidCapturePhaseTransition("uploading", "uploaded"), true);
    assert.equal(isValidCapturePhaseTransition("uploading", "failed"), true);
    assert.equal(isValidCapturePhaseTransition("waiting_ocr", "idle"), false);
    assert.equal(isValidCapturePhaseTransition("completed", "uploading"), false);
  });

  it("records every transition in CapturePhaseMachine", () => {
    const machine = new CapturePhaseMachine();
    machine.transition("uploading", "start");
    machine.transition("uploaded", "stored");
    machine.transition("preprocessing", "auto");
    machine.transition("waiting_ocr", "pipeline");
    assert.equal(machine.current, "waiting_ocr");
    assert.equal(machine.history.length, 4);
    assert.equal(machine.history[0]!.from, "idle");
    assert.equal(machine.history[3]!.to, "waiting_ocr");
  });

  it("allows retry from failed to uploading", () => {
    const machine = new CapturePhaseMachine();
    machine.transition("uploading");
    machine.transition("failed", "network");
    machine.transition("uploading", "retry");
    assert.equal(machine.current, "uploading");
  });

  it("exposes timeline phases for UI", () => {
    assert.ok(CAPTURE_TIMELINE_PHASES.includes("waiting_ocr"));
    assert.equal(CAPTURE_PHASE_ORDER.indexOf("completed"), CAPTURE_PHASE_ORDER.length - 1);
  });

  it("computes next phase", () => {
    assert.equal(nextCapturePhase("preprocessing"), "waiting_ocr");
    assert.equal(nextCapturePhase("completed"), null);
  });

  it("throws on invalid transition", () => {
    assert.throws(() => assertCapturePhaseTransition("idle", "completed"));
  });
});

describe("Capture pipeline — DB state machine", () => {
  it("validates post-upload auto pipeline", () => {
    for (let i = 0; i < POST_UPLOAD_AUTO_STATUSES.length - 1; i++) {
      const from = POST_UPLOAD_AUTO_STATUSES[i]!;
      const to = POST_UPLOAD_AUTO_STATUSES[i + 1]!;
      assert.equal(isValidCaptureTransition(from, to), true);
    }
    assert.equal(POST_UPLOAD_AUTO_STATUSES[POST_UPLOAD_AUTO_STATUSES.length - 1], "OCR_PENDING");
  });

  it("maps domain phases to DB status", () => {
    assert.equal(phaseToDbStatus("waiting_ocr"), "OCR_PENDING");
    assert.equal(phaseToDbStatus("uploading"), null);
    assert.equal(dbStatusToPhase("OCR_PENDING"), "waiting_ocr");
    assert.equal(dbStatusToPhase("ARCHIVED"), "cancelled");
    assert.equal(dbStatusToPhase("APPROVED"), "completed");
  });
});

describe("Capture pipeline — events", () => {
  it("builds required pipeline events", () => {
    const created = buildCaptureEvent("capture_created", "sess-1");
    assert.equal(created.type, "capture_created");
    assert.equal(created.sessionId, "sess-1");

    const uploaded = eventForDbStatusTransition("UPLOADED", "sess-1");
    assert.equal(uploaded?.type, "capture_uploaded");

    const preprocessed = eventForDbStatusTransition("PREPROCESSING", "sess-1");
    assert.equal(preprocessed?.type, "capture_preprocessed");

    const ready = eventForDbStatusTransition("OCR_PENDING", "sess-1");
    assert.equal(ready?.type, "capture_ready_for_ocr");

    const failed = buildFailedEvent("sess-1", "timeout");
    assert.equal(failed.type, "capture_failed");
    assert.equal(failed.payload?.reason, "timeout");
  });

  it("appends events to metadata", () => {
    const e1 = buildCaptureEvent("capture_created", "s1");
    const m1 = appendCaptureEvent({}, e1);
    const e2 = buildCaptureEvent("capture_uploaded", "s1");
    const m2 = appendCaptureEvent(m1, e2);
    const events = m2.captureEvents as unknown[];
    assert.equal(events.length, 2);
  });
});

describe("Capture pipeline — storage paths & validation", () => {
  const tenantId = "00000000-0000-4000-8000-000000000001";
  const captureId = "00000000-0000-4000-8000-000000000002";

  it("builds original object key", () => {
    const key = buildOriginalObjectKey(tenantId, captureId, "guia-tiss.pdf");
    assert.match(key, new RegExp(`^${tenantId}/${captureId}/original/`));
    assert.ok(key.endsWith("guia-tiss.pdf"));
  });

  it("builds versioned object keys", () => {
    const v1 = buildVersionedObjectKey(tenantId, captureId, "guia.pdf", 1);
    const v2 = buildVersionedObjectKey(tenantId, captureId, "guia.pdf", 2);
    assert.ok(v1.includes("guia.pdf"));
    assert.ok(v2.includes("guia_v2.pdf"));
  });

  it("increments document version from metadata", () => {
    assert.equal(nextDocumentVersion({ documentVersion: 2 }), 3);
    assert.equal(nextDocumentVersion({}), 1);
  });

  it("rejects invalid uploads", () => {
    assert.throws(() =>
      validateCaptureUpload({
        mimeType: "text/plain",
        byteLength: 100,
        filename: "x.txt",
        fileBytes: new Uint8Array(100),
      }),
    );
    assert.throws(() =>
      validateCaptureUpload({
        mimeType: "image/jpeg",
        byteLength: 0,
        filename: "x.jpg",
        fileBytes: new Uint8Array(0),
      }),
    );
  });

  it("rejects Content-Type mentiroso (magic bytes não batem)", () => {
    assert.throws(() =>
      validateCaptureUpload({
        mimeType: "image/jpeg",
        byteLength: 4,
        filename: "x.jpg",
        fileBytes: new Uint8Array([0x00, 0x01, 0x02, 0x03]),
      }),
    );
  });

  it("accepts valid clinical mime types", () => {
    const jpegBytes = new Uint8Array(64);
    jpegBytes.set([0xff, 0xd8, 0xff], 0);
    assert.doesNotThrow(() =>
      validateCaptureUpload({
        mimeType: "image/jpeg",
        byteLength: jpegBytes.length,
        filename: "guia.jpg",
        fileBytes: jpegBytes,
      }),
    );
  });
});

describe("Capture pipeline — HTTP router", () => {
  it("parses capture REST paths", () => {
    assert.deepEqual(parseCaptureHttpPath("/capture"), {});
    assert.deepEqual(parseCaptureHttpPath("/capture/abc-123"), { sessionId: "abc-123" });
    assert.deepEqual(parseCaptureHttpPath("/capture/abc-123/status"), {
      sessionId: "abc-123",
      subResource: "status",
    });
    assert.equal(parseCaptureHttpPath("/other"), null);
  });
});

describe("Capture pipeline — file utils", () => {
  it("formats file size and mime labels", () => {
    assert.equal(formatFileSize(512), "512 B");
    assert.equal(formatFileSize(2048), "2.0 KB");
    assert.equal(mimeTypeLabel("application/pdf"), "PDF");
  });
});

describe("Capture pipeline — module structure", () => {
  it("has required domain folders", () => {
    const base = resolve(root, "src/modules/capture");
    for (const dir of ["components", "hooks", "services", "types", "pages", "utils"]) {
      assert.ok(existsSync(resolve(base, dir)), `missing ${dir}/`);
    }
  });

  it("defines OcrProvider contract without implementation", () => {
    const path = resolve(root, "src/modules/capture/types/ocr-provider.ts");
    const src = readFileSync(path, "utf8");
    assert.ok(src.includes("interface OcrProvider"));
    assert.ok(src.includes("extract("));
    assert.ok(src.includes("health("));
    assert.ok(src.includes("capabilities("));
    assert.ok(!src.includes("Azure"));
    assert.ok(!src.includes("Tesseract"));
  });
});

describe("Capture pipeline — integration", () => {
  it("skips storage integration without Supabase credentials", async (t) => {
    const hasIntegration =
      Boolean(process.env.VITE_SUPABASE_URL) &&
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!hasIntegration) {
      t.skip("Supabase não configurado — integração omitida");
      return;
    }
    assert.ok(process.env.VITE_SUPABASE_URL?.includes("vbfulflzekrnejwetcyr"));
  });
});
