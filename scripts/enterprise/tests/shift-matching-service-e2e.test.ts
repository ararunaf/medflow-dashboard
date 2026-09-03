/**
 * F4-S3 — Shift Matching Agent, contra o Supabase de staging real: prova
 * que os filtros duros (afiliação institucional, conflito de horário) e a
 * pontuação por especialidade/disponibilidade funcionam com dado real do
 * banco, não só com os `ShiftMatchCandidateInput` sintéticos do teste
 * puro (shift-matching-agent.test.ts). A camada de IA (rationale em texto)
 * já é coberta pelo teste puro com um provider falso — aqui o que importa
 * é a carga real de professionals/availability/professional_hospitals/
 * shift_assignments via `suggestProfessionalsForShift`.
 *
 * Cria um tenant com 1 hospital, 1 plantão aberto exigindo "Clínica Médica"
 * e 3 profissionais de teste dedicados (prefixo "e2e-f4s3-"):
 *   - A: Clínica Médica, disponibilidade cobrindo o horário → deve aparecer
 *     com a maior pontuação.
 *   - B: Ortopedia (não combina), sem disponibilidade cadastrada → aparece,
 *     mas com pontuação menor.
 *   - C: Clínica Médica, mas já tem outro plantão confirmado no mesmo
 *     horário (conflito real) → NUNCA deve aparecer na lista.
 * Limpa tudo ao final. Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import { suggestProfessionalsForShift } from "../../../src/lib/services/operations/shift-matching-service.ts";

const hasSupabase = Boolean(process.env.VITE_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("F4-S3 — Shift Matching Agent com dado real (Supabase real de staging)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let client: SupabaseClient<Database>;
  let tenantId: string;
  let hospitalId: string;
  let shiftId: string;
  let otherShiftId: string;
  const authUserIds: string[] = [];
  let profAId: string;
  let profBId: string;
  let profCId: string;
  let coordinatorCtx: ServiceCtx;

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await client
      .from("tenants")
      .insert({ name: `E2E F4-S3 ${suffix}`, slug: `e2e-f4s3-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    const hospital = await client
      .from("hospitals")
      .insert({ tenant_id: tenantId, name: "E2E Hospital F4-S3" })
      .select("id")
      .single();
    if (hospital.error) throw new Error(`setup hospital: ${hospital.error.message}`);
    hospitalId = hospital.data.id;

    const unit = await client
      .from("units")
      .insert({ tenant_id: tenantId, hospital_id: hospitalId, name: "E2E Unidade" })
      .select("id")
      .single();
    if (unit.error) throw new Error(`setup unit: ${unit.error.message}`);

    const department = await client
      .from("departments")
      .insert({ tenant_id: tenantId, unit_id: unit.data.id, name: "E2E Departamento" })
      .select("id")
      .single();
    if (department.error) throw new Error(`setup department: ${department.error.message}`);

    const schedule = await client
      .from("schedules")
      .insert({
        tenant_id: tenantId,
        department_id: department.data.id,
        name: "E2E Escala",
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      })
      .select("id")
      .single();
    if (schedule.error) throw new Error(`setup schedule: ${schedule.error.message}`);

    // Plantão de terça-feira (2026-08-18 é uma terça), 08:00-14:00 local do
    // servidor — evita virada de dia (a checagem de disponibilidade não
    // afere plantão que atravessa meia-noite, ver shift-matching-service.ts).
    const shift = await client
      .from("shifts")
      .insert({
        tenant_id: tenantId,
        schedule_id: schedule.data.id,
        department_id: department.data.id,
        starts_at: "2026-08-18T08:00:00-03:00",
        ends_at: "2026-08-18T14:00:00-03:00",
        role_required: "Clínica Médica",
      })
      .select("id")
      .single();
    if (shift.error) throw new Error(`setup shift: ${shift.error.message}`);
    shiftId = shift.data.id;

    // Plantão que vai conflitar com o profissional C (mesmo horário exato).
    const otherShift = await client
      .from("shifts")
      .insert({
        tenant_id: tenantId,
        schedule_id: schedule.data.id,
        department_id: department.data.id,
        starts_at: "2026-08-18T08:00:00-03:00",
        ends_at: "2026-08-18T14:00:00-03:00",
        role_required: "",
      })
      .select("id")
      .single();
    if (otherShift.error) throw new Error(`setup other shift: ${otherShift.error.message}`);
    otherShiftId = otherShift.data.id;

    async function makeProfessional(label: string, specialty: string) {
      const authUser = await client.auth.admin.createUser({
        email: `e2e-f4s3-${label}-${suffix}@example.invalid`,
        password: `Test-${suffix}-${label}-!Aa1`,
        email_confirm: true,
      });
      if (authUser.error || !authUser.data.user) throw new Error(`setup auth user ${label}: ${authUser.error?.message}`);
      authUserIds.push(authUser.data.user.id);

      const profile = await client
        .from("profiles")
        .insert({
          id: authUser.data.user.id,
          tenant_id: tenantId,
          full_name: `E2E F4-S3 Profissional ${label}`,
          role: "professional",
        })
        .select("id")
        .single();
      if (profile.error) throw new Error(`setup profile ${label}: ${profile.error.message}`);

      const professional = await client
        .from("professionals")
        .insert({
          tenant_id: tenantId,
          profile_id: profile.data.id,
          specialty,
          crm: `SP-${label}${suffix}`,
        })
        .select("id")
        .single();
      if (professional.error) throw new Error(`setup professional ${label}: ${professional.error.message}`);
      return professional.data.id;
    }

    profAId = await makeProfessional("a", "Clínica Médica");
    profBId = await makeProfessional("b", "Ortopedia");
    profCId = await makeProfessional("c", "Clínica Médica");

    // A tem disponibilidade cadastrada cobrindo terça 08:00-14:00 (weekday=2).
    const avail = await client.from("availability").insert({
      tenant_id: tenantId,
      professional_id: profAId,
      weekday: 2,
      start_time: "07:00:00",
      end_time: "15:00:00",
      available: true,
    });
    if (avail.error) throw new Error(`setup availability: ${avail.error.message}`);

    // C já tem atribuição confirmada no OUTRO plantão, mesmo horário — conflito real.
    const conflictAssignment = await client
      .from("shift_assignments")
      .insert({
        tenant_id: tenantId,
        shift_id: otherShiftId,
        professional_id: profCId,
        assignment_status: "confirmed",
      });
    if (conflictAssignment.error) throw new Error(`setup conflict assignment: ${conflictAssignment.error.message}`);

    const coordAuthUser = await client.auth.admin.createUser({
      email: `e2e-f4s3-coord-${suffix}@example.invalid`,
      password: `Test-${suffix}-coord-!Aa1`,
      email_confirm: true,
    });
    if (coordAuthUser.error || !coordAuthUser.data.user) {
      throw new Error(`setup coordinator auth user: ${coordAuthUser.error?.message}`);
    }
    authUserIds.push(coordAuthUser.data.user.id);
    const coordProfile = await client
      .from("profiles")
      .insert({
        id: coordAuthUser.data.user.id,
        tenant_id: tenantId,
        full_name: "E2E F4-S3 Coordenador",
        role: "coordinator",
      })
      .select("id")
      .single();
    if (coordProfile.error) throw new Error(`setup coordinator profile: ${coordProfile.error.message}`);

    coordinatorCtx = {
      client,
      tenantId,
      role: "coordinator",
      userId: coordAuthUser.data.user.id,
      actorProfileId: coordProfile.data.id,
      professionalId: null,
    };
  });

  after(async () => {
    if (!client || !tenantId) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["shift_assignments", () => client.from("shift_assignments").delete().eq("tenant_id", tenantId)],
      ["availability", () => client.from("availability").delete().eq("tenant_id", tenantId)],
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
    for (const id of authUserIds) {
      const del = await client.auth.admin.deleteUser(id);
      if (del.error) console.warn(`[E2E cleanup] auth user ${id}: ${del.error.message}`);
    }
    const { error: tenantErr } = await client.from("tenants").delete().eq("id", tenantId);
    if (tenantErr) console.warn(`[E2E cleanup] tenant: ${tenantErr.message}`);
  });

  it("filtra conflito real de horário, pontua especialidade+disponibilidade reais, nunca derruba por falha de IA", async () => {
    const suggestions = await suggestProfessionalsForShift(coordinatorCtx, shiftId);

    const ids = suggestions.map((s) => s.professionalId);
    assert.ok(ids.includes(profAId), "profissional A (especialidade+disponibilidade combinando) deve aparecer");
    assert.ok(ids.includes(profBId), "profissional B (sem conflito) deve aparecer, mesmo pontuando menos");
    assert.ok(!ids.includes(profCId), "profissional C tem conflito real de horário — nunca deve aparecer");

    const a = suggestions.find((s) => s.professionalId === profAId)!;
    const b = suggestions.find((s) => s.professionalId === profBId)!;
    assert.equal(a.signals.specialtyMatch, true);
    assert.equal(a.signals.availabilityMatch, true);
    assert.equal(b.signals.specialtyMatch, false);
    assert.equal(b.signals.availabilityMatch, null);
    assert.ok(a.score > b.score, "A deve pontuar mais que B");

    // Ordem determinística: A antes de B.
    assert.equal(ids.indexOf(profAId) < ids.indexOf(profBId), true);
  });

  it("rejeita sugestão para plantão que não está mais aberto", async () => {
    const closed = await client.from("shifts").update({ status: "cancelled" }).eq("id", shiftId);
    assert.equal(closed.error, null, closed.error?.message);
    await assert.rejects(() => suggestProfessionalsForShift(coordinatorCtx, shiftId), /aberto|open/i);
    // Reverte para não afetar a ordem de execução caso o runner reordene testes.
    await client.from("shifts").update({ status: "open" }).eq("id", shiftId);
  });
});
