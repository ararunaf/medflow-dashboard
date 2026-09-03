/**
 * F4-S2 — central multi-instituição, contra o Supabase de staging real: um
 * profissional afiliado a uma instituição não pode se auto-atribuir a um
 * plantão de outra instituição do mesmo tenant; sem nenhuma afiliação
 * registrada, o comportamento anterior (sem restrição) continua valendo.
 *
 * Não é simulação: chama os services reais (institutions.ts, assignments.ts)
 * exatamente como o app faz — `professional_hospitals` é uma tabela real
 * (F1-S2) que até esta sprint nunca era lida em lugar nenhum; este teste
 * prova que a leitura agora realmente restringe a auto-atribuição.
 *
 * Cria um tenant com 2 hospitais/plantões dedicados (prefixo "e2e-f4s2-") e
 * limpa tudo ao final. Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import { selfAssignOpenShift } from "../../../src/lib/services/operations/assignments.ts";
import {
  getActiveAffiliatedHospitalIds,
  listProfessionalAffiliations,
  setProfessionalHospitalAffiliation,
} from "../../../src/lib/services/operations/institutions.ts";
import { PermissionError } from "../../../src/lib/domain/operations/errors.ts";

const hasSupabase = Boolean(process.env.VITE_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("F4-S2 — afiliação institucional restringe auto-atribuição (Supabase real de staging)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let client: SupabaseClient<Database>;
  let tenantId: string;
  let hospitalAId: string;
  let hospitalBId: string;
  let shiftAId: string;
  let shiftBId: string;
  let authUserId: string;
  let profileId: string;
  let professionalId: string;
  let coordinatorAuthUserId: string;
  let coordinatorProfileId: string;

  async function makeShift(hospitalId: string, suffix: string) {
    const unit = await client
      .from("units")
      .insert({ tenant_id: tenantId, hospital_id: hospitalId, name: `E2E Unidade ${suffix}` })
      .select("id")
      .single();
    if (unit.error) throw new Error(`setup unit ${suffix}: ${unit.error.message}`);

    const department = await client
      .from("departments")
      .insert({ tenant_id: tenantId, unit_id: unit.data.id, name: `E2E Departamento ${suffix}` })
      .select("id")
      .single();
    if (department.error) throw new Error(`setup department ${suffix}: ${department.error.message}`);

    const schedule = await client
      .from("schedules")
      .insert({
        tenant_id: tenantId,
        department_id: department.data.id,
        name: `E2E Escala ${suffix}`,
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      })
      .select("id")
      .single();
    if (schedule.error) throw new Error(`setup schedule ${suffix}: ${schedule.error.message}`);

    const shift = await client
      .from("shifts")
      .insert({
        tenant_id: tenantId,
        schedule_id: schedule.data.id,
        department_id: department.data.id,
        starts_at: "2026-08-15T08:00:00Z",
        ends_at: "2026-08-15T20:00:00Z",
      })
      .select("id")
      .single();
    if (shift.error) throw new Error(`setup shift ${suffix}: ${shift.error.message}`);
    return shift.data.id;
  }

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await client
      .from("tenants")
      .insert({ name: `E2E F4-S2 ${suffix}`, slug: `e2e-f4s2-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    const hospitalA = await client
      .from("hospitals")
      .insert({ tenant_id: tenantId, name: "E2E Hospital A" })
      .select("id")
      .single();
    if (hospitalA.error) throw new Error(`setup hospital A: ${hospitalA.error.message}`);
    hospitalAId = hospitalA.data.id;

    const hospitalB = await client
      .from("hospitals")
      .insert({ tenant_id: tenantId, name: "E2E Hospital B" })
      .select("id")
      .single();
    if (hospitalB.error) throw new Error(`setup hospital B: ${hospitalB.error.message}`);
    hospitalBId = hospitalB.data.id;

    shiftAId = await makeShift(hospitalAId, "A");
    shiftBId = await makeShift(hospitalBId, "B");

    const authUser = await client.auth.admin.createUser({
      email: `e2e-f4s2-${suffix}@example.invalid`,
      password: `Test-${suffix}-!Aa1`,
      email_confirm: true,
    });
    if (authUser.error || !authUser.data.user) throw new Error(`setup auth user: ${authUser.error?.message}`);
    authUserId = authUser.data.user.id;

    const profile = await client
      .from("profiles")
      .insert({ id: authUserId, tenant_id: tenantId, full_name: "E2E F4-S2 Profissional", role: "professional" })
      .select("id")
      .single();
    if (profile.error) throw new Error(`setup profile: ${profile.error.message}`);
    profileId = profile.data.id;

    const professional = await client
      .from("professionals")
      .insert({ tenant_id: tenantId, profile_id: profileId, specialty: "Clínica Médica", crm: "SP-999999" })
      .select("id")
      .single();
    if (professional.error) throw new Error(`setup professional: ${professional.error.message}`);
    professionalId = professional.data.id;

    const coordAuthUser = await client.auth.admin.createUser({
      email: `e2e-f4s2-coord-${suffix}@example.invalid`,
      password: `Test-${suffix}-coord-!Aa1`,
      email_confirm: true,
    });
    if (coordAuthUser.error || !coordAuthUser.data.user) {
      throw new Error(`setup coordinator auth user: ${coordAuthUser.error?.message}`);
    }
    coordinatorAuthUserId = coordAuthUser.data.user.id;

    const coordProfile = await client
      .from("profiles")
      .insert({
        id: coordinatorAuthUserId,
        tenant_id: tenantId,
        full_name: "E2E F4-S2 Coordenador",
        role: "coordinator",
      })
      .select("id")
      .single();
    if (coordProfile.error) throw new Error(`setup coordinator profile: ${coordProfile.error.message}`);
    coordinatorProfileId = coordProfile.data.id;
  });

  after(async () => {
    if (!client || !tenantId) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["shift_assignments", () => client.from("shift_assignments").delete().eq("tenant_id", tenantId)],
      ["professional_hospitals", () => client.from("professional_hospitals").delete().eq("tenant_id", tenantId)],
      ["shifts", () => client.from("shifts").delete().eq("tenant_id", tenantId)],
      ["schedules", () => client.from("schedules").delete().eq("tenant_id", tenantId)],
      ["departments", () => client.from("departments").delete().eq("tenant_id", tenantId)],
      ["units", () => client.from("units").delete().eq("tenant_id", tenantId)],
      ["hospitals", () => client.from("hospitals").delete().eq("tenant_id", tenantId)],
      ["operational_events", () => client.from("operational_events").delete().eq("tenant_id", tenantId)],
    ];
    for (const [label, run] of steps) {
      const { error } = await run();
      if (error) console.warn(`[E2E cleanup] ${label}: ${error.message}`);
    }
    for (const id of [authUserId, coordinatorAuthUserId]) {
      if (!id) continue;
      const del = await client.auth.admin.deleteUser(id);
      if (del.error) console.warn(`[E2E cleanup] auth user ${id}: ${del.error.message}`);
    }
    const { error: tenantErr } = await client.from("tenants").delete().eq("id", tenantId);
    if (tenantErr) console.warn(`[E2E cleanup] tenant: ${tenantErr.message}`);
  });

  it("sem afiliação registrada, auto-atribuição funciona em qualquer instituição (compatibilidade)", async () => {
    const ctx: ServiceCtx = {
      client,
      tenantId,
      role: "professional",
      userId: authUserId,
      actorProfileId: profileId,
      professionalId,
    };
    assert.equal(await getActiveAffiliatedHospitalIds(ctx, professionalId), null);

    const assignment = await selfAssignOpenShift(ctx, shiftAId);
    assert.equal(assignment.assignment_status, "confirmed");

    // Libera de novo para o próximo teste.
    await client.from("shift_assignments").delete().eq("id", assignment.id);
  });

  it("coordenador afilia o profissional só ao hospital A; RBAC bloqueia profissional tentando afiliar a si mesmo", async () => {
    const professionalCtx: ServiceCtx = {
      client,
      tenantId,
      role: "professional",
      userId: authUserId,
      actorProfileId: profileId,
      professionalId,
    };
    await assert.rejects(
      () => setProfessionalHospitalAffiliation(professionalCtx, { professionalId, hospitalId: hospitalAId, active: true }),
      /permission|permiss/i,
    );

    const coordinatorCtx: ServiceCtx = {
      client,
      tenantId,
      role: "coordinator",
      userId: coordinatorAuthUserId,
      actorProfileId: coordinatorProfileId,
      professionalId: null,
    };
    await setProfessionalHospitalAffiliation(coordinatorCtx, {
      professionalId,
      hospitalId: hospitalAId,
      active: true,
    });

    const affiliated = await getActiveAffiliatedHospitalIds(coordinatorCtx, professionalId);
    assert.deepEqual(affiliated, [hospitalAId]);

    const summary = await listProfessionalAffiliations(coordinatorCtx);
    const mine = summary.find((p) => p.professionalId === professionalId);
    assert.ok(mine, "profissional deve aparecer na matriz de afiliação");
    assert.equal(mine!.affiliations.length, 1);
    assert.equal(mine!.affiliations[0]!.hospitalId, hospitalAId);
    assert.equal(mine!.affiliations[0]!.active, true);
  });

  it("com afiliação só ao hospital A: auto-atribuição no A funciona, no B é bloqueada de verdade", async () => {
    const ctx: ServiceCtx = {
      client,
      tenantId,
      role: "professional",
      userId: authUserId,
      actorProfileId: profileId,
      professionalId,
    };

    const assignment = await selfAssignOpenShift(ctx, shiftAId);
    assert.equal(assignment.assignment_status, "confirmed");

    await assert.rejects(
      () => selfAssignOpenShift(ctx, shiftBId),
      (err: unknown) => err instanceof PermissionError,
    );

    // A tentativa bloqueada não deve deixar atribuição pending órfã no B.
    const { data: leftoverB, error: leftoverErr } = await client
      .from("shift_assignments")
      .select("id")
      .eq("shift_id", shiftBId)
      .eq("professional_id", professionalId);
    assert.equal(leftoverErr, null, leftoverErr?.message);
    assert.equal(leftoverB!.length, 0, "assertSelfAssignRespectsHospitalAffiliation deve barrar antes de criar a atribuição");
  });

  it("revogar a afiliação (active=false) volta a bloquear até o hospital antes permitido", async () => {
    const coordinatorCtx: ServiceCtx = {
      client,
      tenantId,
      role: "coordinator",
      userId: coordinatorAuthUserId,
      actorProfileId: coordinatorProfileId,
      professionalId: null,
    };
    await setProfessionalHospitalAffiliation(coordinatorCtx, {
      professionalId,
      hospitalId: hospitalAId,
      active: false,
    });

    const ctx: ServiceCtx = {
      client,
      tenantId,
      role: "professional",
      userId: authUserId,
      actorProfileId: profileId,
      professionalId,
    };
    const affiliated = await getActiveAffiliatedHospitalIds(ctx, professionalId);
    assert.deepEqual(affiliated, [], "linha existe mas inativa — zero hospitais ativos, não null");

    await client.from("shift_assignments").delete().eq("shift_id", shiftAId).eq("professional_id", professionalId);

    await assert.rejects(
      () => selfAssignOpenShift(ctx, shiftAId),
      (err: unknown) => err instanceof PermissionError,
    );
  });
});
