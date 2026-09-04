/**
 * F5-S3 — achado real de auditoria interna: `medical_payouts_select_tenant`
 * (e as policies irmãs em medical_production/medical_payout_items)
 * liberavam SELECT para qualquer membro autenticado do tenant — qualquer
 * profissional conseguia ler o repasse individual de QUALQUER outro
 * profissional do mesmo tenant. Corrigido para self-or-billing
 * (20260903170000_restrict_payout_select_to_self_or_billing.sql).
 *
 * Prova com sessões REAIS (anon key + signInWithPassword, não
 * service_role — a mesma lição do F4-S1/F4-S4/F5-S1/F5-S2, sem a qual
 * este teste nunca provaria a RLS de verdade): profissional A só enxerga
 * o próprio repasse via SELECT; o repasse do profissional B simplesmente
 * não aparece (RLS filtra a linha, não dá erro — o registro parece não
 * existir). Coordenador continua enxergando ambos.
 *
 * Cria um tenant dedicado (prefixo "e2e-f5s3-") e limpa tudo ao final.
 * Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";

const hasSupabase =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("F5-S3 — RLS de medical_payouts restrita a self-or-billing (sessões reais, Supabase real)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let admin: SupabaseClient<Database>;
  let tenantId: string;
  let professionalAId: string;
  let professionalBId: string;
  let payoutAId: string;
  let payoutBId: string;
  const authUserIds: string[] = [];
  let clientA: SupabaseClient<Database>;
  let clientCoord: SupabaseClient<Database>;

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    admin = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await admin
      .from("tenants")
      .insert({ name: `E2E F5-S3 ${suffix}`, slug: `e2e-f5s3-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    async function makeUser(label: string, role: "professional" | "coordinator") {
      const email = `e2e-f5s3-${label}-${suffix}@example.invalid`;
      const password = `Test-${suffix}-${label}-!Aa1`;
      const authUser = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (authUser.error || !authUser.data.user) throw new Error(`setup auth user ${label}: ${authUser.error?.message}`);
      authUserIds.push(authUser.data.user.id);

      const profile = await admin
        .from("profiles")
        .insert({ id: authUser.data.user.id, tenant_id: tenantId, full_name: `E2E F5-S3 ${label}`, role })
        .select("id")
        .single();
      if (profile.error) throw new Error(`setup profile ${label}: ${profile.error.message}`);

      let professionalId: string | null = null;
      if (role === "professional") {
        const professional = await admin
          .from("professionals")
          .insert({ tenant_id: tenantId, profile_id: profile.data.id, specialty: "Clínica Médica", crm: `SP-${label}${suffix}` })
          .select("id")
          .single();
        if (professional.error) throw new Error(`setup professional ${label}: ${professional.error.message}`);
        professionalId = professional.data.id;
      }

      const { createClient: createAnonClient } = await import("@supabase/supabase-js");
      const client = createAnonClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false },
      });
      const signIn = await client.auth.signInWithPassword({ email, password });
      if (signIn.error) throw new Error(`sign in ${label}: ${signIn.error.message}`);

      return { professionalId, client };
    }

    const a = await makeUser("a", "professional");
    professionalAId = a.professionalId!;
    clientA = a.client;

    const b = await makeUser("b", "professional");
    professionalBId = b.professionalId!;

    const coord = await makeUser("coord", "coordinator");
    clientCoord = coord.client;

    const payoutA = await admin
      .from("medical_payouts")
      .insert({ tenant_id: tenantId, professional_id: professionalAId, competence_month: "2026-08-01", gross_value: 1000, net_value: 900, final_value: 900 })
      .select("id")
      .single();
    if (payoutA.error) throw new Error(`setup payout A: ${payoutA.error.message}`);
    payoutAId = payoutA.data.id;

    const payoutB = await admin
      .from("medical_payouts")
      .insert({ tenant_id: tenantId, professional_id: professionalBId, competence_month: "2026-08-01", gross_value: 2000, net_value: 1800, final_value: 1800 })
      .select("id")
      .single();
    if (payoutB.error) throw new Error(`setup payout B: ${payoutB.error.message}`);
    payoutBId = payoutB.data.id;
  });

  after(async () => {
    if (!admin || !tenantId) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["medical_payouts", () => admin.from("medical_payouts").delete().eq("tenant_id", tenantId)],
      ["professionals", () => admin.from("professionals").delete().eq("tenant_id", tenantId)],
    ];
    for (const [label, run] of steps) {
      const { error } = await run();
      if (error) console.warn(`[E2E cleanup] ${label}: ${error.message}`);
    }
    for (const id of authUserIds) {
      const del = await admin.auth.admin.deleteUser(id);
      if (del.error) console.warn(`[E2E cleanup] auth user ${id}: ${del.error.message}`);
    }
    const { error: tenantErr } = await admin.from("tenants").delete().eq("id", tenantId);
    if (tenantErr) console.warn(`[E2E cleanup] tenant: ${tenantErr.message}`);
  });

  it("profissional só enxerga o próprio repasse via SELECT direto (RLS filtra a linha do colega)", async () => {
    const ownRow = await clientA.from("medical_payouts").select("id, final_value").eq("id", payoutAId).maybeSingle();
    assert.equal(ownRow.error, null, ownRow.error?.message);
    assert.ok(ownRow.data, "profissional deve enxergar o próprio repasse");
    assert.equal(ownRow.data!.final_value, 900);

    const colleagueRow = await clientA.from("medical_payouts").select("id, final_value").eq("id", payoutBId).maybeSingle();
    assert.equal(colleagueRow.error, null, colleagueRow.error?.message);
    assert.equal(colleagueRow.data, null, "RLS deve filtrar o repasse do colega — não pode aparecer");
  });

  it("listagem sem filtro por id também só traz a própria linha, nunca a do colega", async () => {
    const list = await clientA.from("medical_payouts").select("id, professional_id").eq("tenant_id", tenantId);
    assert.equal(list.error, null, list.error?.message);
    const ids = (list.data ?? []).map((r) => r.id);
    assert.ok(ids.includes(payoutAId), "própria linha deve aparecer na listagem");
    assert.ok(!ids.includes(payoutBId), "linha do colega NUNCA deve aparecer na listagem");
  });

  it("coordenador (can_manage_billing) continua enxergando o repasse de ambos os profissionais", async () => {
    const list = await clientCoord.from("medical_payouts").select("id, professional_id").eq("tenant_id", tenantId);
    assert.equal(list.error, null, list.error?.message);
    const ids = (list.data ?? []).map((r) => r.id);
    assert.ok(ids.includes(payoutAId) && ids.includes(payoutBId), "gestor de billing deve continuar vendo o repasse de todos os profissionais");
  });
});
