/**
 * F5-S2 — criptografia real em repouso de tiss_guides.patient_name,
 * exercida por uma sessão REAL de coordenador (anon key +
 * signInWithPassword, não service_role) através dos services de verdade
 * (createTissGuide, listTissGuides, getTissGuideWithItems, updateTissGuide)
 * — não só a RPC crua. A lição do F4-S1/F4-S4 se repete aqui: service_role
 * ignora RLS/GRANT e nunca provaria que um usuário real consegue
 * encrypt_patient_name/patient_name_decrypted.
 *
 * Prova: (1) a coluna bruta no banco é ciphertext ilegível (lido via
 * service_role, fonte confiável); (2) os services devolvem o nome em
 * texto plano correto na criação, na listagem, no detalhe e depois de um
 * update que troca o nome.
 *
 * Cria um tenant dedicado (prefixo "e2e-f5s2-") e limpa tudo ao final.
 * Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import {
  createTissGuide,
  getTissGuideWithItems,
  listTissGuides,
  updateTissGuide,
} from "../../../src/lib/services/tiss/guide-service.ts";

const hasSupabase =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("F5-S2 — criptografia de tiss_guides.patient_name (sessão real de coordenador, Supabase real)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let admin: SupabaseClient<Database>;
  let coordinatorClient: SupabaseClient<Database>;
  let tenantId: string;
  let providerId: string;
  let professionalId: string;
  let authUserId: string;
  let profileId: string;
  let guideId: string;
  let coordinatorCtx: ServiceCtx;

  const originalName = "Maria Aparecida de Souza Encriptação";
  const renamedTo = "João Batista Renomeado";

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    admin = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await admin
      .from("tenants")
      .insert({ name: `E2E F5-S2 ${suffix}`, slug: `e2e-f5s2-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    const email = `e2e-f5s2-${suffix}@example.invalid`;
    const password = `Test-${suffix}-!Aa1`;
    const authUser = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (authUser.error || !authUser.data.user) throw new Error(`setup auth user: ${authUser.error?.message}`);
    authUserId = authUser.data.user.id;

    const profile = await admin
      .from("profiles")
      .insert({ id: authUserId, tenant_id: tenantId, full_name: "E2E F5-S2 Coordenador", role: "coordinator" })
      .select("id")
      .single();
    if (profile.error) throw new Error(`setup profile: ${profile.error.message}`);
    profileId = profile.data.id;

    const professional = await admin
      .from("professionals")
      .insert({ tenant_id: tenantId, profile_id: profileId, specialty: "Clínica Médica", crm: "SP-555555" })
      .select("id")
      .single();
    if (professional.error) throw new Error(`setup professional: ${professional.error.message}`);
    professionalId = professional.data.id;

    const provider = await admin
      .from("insurance_providers")
      .insert({ tenant_id: tenantId, name: "E2E Operadora F5-S2", ans_code: "555555" })
      .select("id")
      .single();
    if (provider.error) throw new Error(`setup insurance_provider: ${provider.error.message}`);
    providerId = provider.data.id;

    const { createClient: createAnonClient } = await import("@supabase/supabase-js");
    coordinatorClient = createAnonClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const signIn = await coordinatorClient.auth.signInWithPassword({ email, password });
    if (signIn.error) throw new Error(`sign in as coordinator: ${signIn.error.message}`);

    coordinatorCtx = {
      client: coordinatorClient,
      tenantId,
      role: "coordinator",
      userId: authUserId,
      actorProfileId: profileId,
      professionalId,
    };
  });

  after(async () => {
    if (!admin || !tenantId) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["tiss_guides", () => admin.from("tiss_guides").delete().eq("tenant_id", tenantId)],
      ["insurance_providers", () => admin.from("insurance_providers").delete().eq("tenant_id", tenantId)],
      ["operational_events", () => admin.from("operational_events").delete().eq("tenant_id", tenantId)],
    ];
    for (const [label, run] of steps) {
      const { error } = await run();
      if (error) console.warn(`[E2E cleanup] ${label}: ${error.message}`);
    }
    if (authUserId) {
      const del = await admin.auth.admin.deleteUser(authUserId);
      if (del.error) console.warn(`[E2E cleanup] auth user: ${del.error.message}`);
    }
    const { error: tenantErr } = await admin.from("tenants").delete().eq("id", tenantId);
    if (tenantErr) console.warn(`[E2E cleanup] tenant: ${tenantErr.message}`);
  });

  it("cria, lista, detalha e atualiza patient_name com texto plano correto via sessão real; coluna bruta é ciphertext", async () => {
    const created = await createTissGuide(coordinatorCtx, {
      guide_type: "consulta",
      patient_name: originalName,
      insurance_provider_id: providerId,
      professional_id: professionalId,
      attendance_date: "2026-08-15",
    });
    guideId = created.id;
    assert.equal(created.patient_name, originalName);

    // Coluna bruta, lida via service_role (fonte confiável) — deve ser
    // ciphertext, nunca o nome em texto plano.
    const raw = await admin.from("tiss_guides").select("patient_name").eq("id", guideId).single();
    assert.equal(raw.error, null, raw.error?.message);
    const rawValue = String(raw.data!.patient_name);
    assert.ok(!rawValue.includes("Maria"), "coluna bruta não pode conter o nome em texto plano");
    assert.ok(rawValue.startsWith("\\x"), "bytea via PostgREST deve vir como hex \\x...");

    const list = await listTissGuides(coordinatorCtx);
    const listed = list.find((g) => g.id === guideId);
    assert.equal(listed?.patient_name, originalName);

    const detail = await getTissGuideWithItems(coordinatorCtx, guideId);
    assert.equal(detail?.patient_name, originalName);

    const updated = await updateTissGuide(coordinatorCtx, guideId, { patient_name: renamedTo });
    assert.equal(updated.patient_name, renamedTo);

    const afterRename = await getTissGuideWithItems(coordinatorCtx, guideId);
    assert.equal(afterRename?.patient_name, renamedTo);

    const rawAfterRename = await admin.from("tiss_guides").select("patient_name").eq("id", guideId).single();
    assert.ok(!String(rawAfterRename.data!.patient_name).includes("João"), "coluna bruta continua ciphertext após update");

    // Update que NÃO toca patient_name preserva o nome (renamedTo), não o zera.
    const untouched = await updateTissGuide(coordinatorCtx, guideId, { status: "pending_review" });
    assert.equal(untouched.patient_name, renamedTo);
  });
});
