/**
 * F4-S1 — auto-atribuição de vaga aberta sob concorrência real, contra o
 * Supabase de staging: dois profissionais tentam assumir o MESMO plantão
 * aberto ao mesmo tempo. Não é simulação em memória — chama
 * `selfAssignOpenShift` (src/lib/services/operations/assignments.ts)
 * exatamente como o botão "Assumir plantão" da UI faz, e a exclusividade
 * real vem do índice parcial `shift_assignments_one_confirmed_per_shift_uidx`
 * no Postgres — se essa garantia estiver quebrada, os dois "vencem" e o
 * teste falha de verdade, não silenciosamente.
 *
 * Cria um tenant/hospital/unit/department/schedule/shift e 2
 * profissionais de teste dedicados (prefixo "e2e-f4s1-") e limpa tudo ao
 * final, respeitando o RESTRICT em operational_events.actor_profile_id
 * (mesmo achado do F3-S4: apagar eventos antes de apagar os usuários).
 * Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import { selfAssignOpenShift } from "../../../src/lib/services/operations/assignments.ts";
import { ConflictError } from "../../../src/lib/domain/operations/errors.ts";

const hasSupabase = Boolean(process.env.VITE_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("F4-S1 — auto-atribuição de plantão sob concorrência real (Supabase real de staging)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let client: SupabaseClient<Database>;
  let tenantId: string;
  let hospitalId: string;
  let unitId: string;
  let departmentId: string;
  let scheduleId: string;
  let shiftId: string;
  const authUserIds: string[] = [];
  const profileIds: string[] = [];
  const professionalIds: string[] = [];

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await client
      .from("tenants")
      .insert({ name: `E2E F4-S1 ${suffix}`, slug: `e2e-f4s1-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    const hospital = await client
      .from("hospitals")
      .insert({ tenant_id: tenantId, name: "E2E Hospital F4-S1" })
      .select("id")
      .single();
    if (hospital.error) throw new Error(`setup hospital: ${hospital.error.message}`);
    hospitalId = hospital.data.id;

    const unit = await client
      .from("units")
      .insert({ tenant_id: tenantId, hospital_id: hospitalId, name: "E2E Unidade F4-S1" })
      .select("id")
      .single();
    if (unit.error) throw new Error(`setup unit: ${unit.error.message}`);
    unitId = unit.data.id;

    const department = await client
      .from("departments")
      .insert({ tenant_id: tenantId, unit_id: unitId, name: "E2E Departamento F4-S1" })
      .select("id")
      .single();
    if (department.error) throw new Error(`setup department: ${department.error.message}`);
    departmentId = department.data.id;

    const schedule = await client
      .from("schedules")
      .insert({
        tenant_id: tenantId,
        department_id: departmentId,
        name: "E2E Escala F4-S1",
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      })
      .select("id")
      .single();
    if (schedule.error) throw new Error(`setup schedule: ${schedule.error.message}`);
    scheduleId = schedule.data.id;

    const shift = await client
      .from("shifts")
      .insert({
        tenant_id: tenantId,
        schedule_id: scheduleId,
        department_id: departmentId,
        starts_at: "2026-08-15T08:00:00Z",
        ends_at: "2026-08-15T20:00:00Z",
      })
      .select("id, status")
      .single();
    if (shift.error) throw new Error(`setup shift: ${shift.error.message}`);
    shiftId = shift.data.id;
    assert.equal(shift.data.status, "open");

    for (let i = 0; i < 2; i++) {
      const authUser = await client.auth.admin.createUser({
        email: `e2e-f4s1-${suffix}-${i}@example.invalid`,
        password: `Test-${suffix}-${i}-!Aa1`,
        email_confirm: true,
      });
      if (authUser.error || !authUser.data.user) {
        throw new Error(`setup auth user ${i}: ${authUser.error?.message}`);
      }
      authUserIds.push(authUser.data.user.id);

      const profile = await client
        .from("profiles")
        .insert({
          id: authUser.data.user.id,
          tenant_id: tenantId,
          full_name: `E2E F4-S1 Profissional ${i}`,
          role: "professional",
        })
        .select("id")
        .single();
      if (profile.error) throw new Error(`setup profile ${i}: ${profile.error.message}`);
      profileIds.push(profile.data.id);

      const professional = await client
        .from("professionals")
        .insert({
          tenant_id: tenantId,
          profile_id: profile.data.id,
          specialty: "Clínica Médica",
          crm: `SP-${100000 + i}`,
        })
        .select("id")
        .single();
      if (professional.error) throw new Error(`setup professional ${i}: ${professional.error.message}`);
      professionalIds.push(professional.data.id);
    }
  });

  after(async () => {
    if (!client || !tenantId) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["shift_assignments", () => client.from("shift_assignments").delete().eq("tenant_id", tenantId)],
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
    for (const authUserId of authUserIds) {
      const del = await client.auth.admin.deleteUser(authUserId); // cascateia profiles -> professionals
      if (del.error) console.warn(`[E2E cleanup] auth user ${authUserId}: ${del.error.message}`);
    }
    const { error: tenantErr } = await client.from("tenants").delete().eq("id", tenantId);
    if (tenantErr) console.warn(`[E2E cleanup] tenant: ${tenantErr.message}`);
  });

  it("apenas um dos dois profissionais concorrentes assume o plantão; o outro recebe conflito real", async () => {
    const ctxFor = (i: number): ServiceCtx => ({
      client,
      tenantId,
      role: "professional",
      userId: authUserIds[i]!,
      actorProfileId: profileIds[i]!,
      professionalId: professionalIds[i]!,
    });

    const results = await Promise.allSettled([
      selfAssignOpenShift(ctxFor(0), shiftId),
      selfAssignOpenShift(ctxFor(1), shiftId),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    assert.equal(fulfilled.length, 1, "exatamente um dos dois deve vencer a corrida");
    assert.equal(rejected.length, 1, "o outro deve receber um erro real do índice parcial");

    const winner = fulfilled[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof selfAssignOpenShift>>>;
    assert.equal(winner.value.assignment_status, "confirmed");

    const loserReason = (rejected[0] as PromiseRejectedResult).reason;
    assert.ok(loserReason instanceof ConflictError, "erro do perdedor deve ser ConflictError real");

    // O shift deve refletir exatamente 1 vencedor (trigger real de sync).
    const { data: shiftRow, error: shiftErr } = await client
      .from("shifts")
      .select("status")
      .eq("id", shiftId)
      .single();
    assert.equal(shiftErr, null, shiftErr?.message);
    assert.equal(shiftRow!.status, "assigned");

    // A atribuição perdedora não deve ficar 'pending' órfã — selfAssignOpenShift
    // a rejeita automaticamente quando a confirmação falha por conflito.
    const { data: assignments, error: assignmentsErr } = await client
      .from("shift_assignments")
      .select("professional_id, assignment_status")
      .eq("shift_id", shiftId);
    assert.equal(assignmentsErr, null, assignmentsErr?.message);
    assert.equal(assignments!.length, 2);
    const statuses = assignments!.map((a) => a.assignment_status).sort();
    assert.deepEqual(statuses, ["confirmed", "rejected"]);
  });
});
