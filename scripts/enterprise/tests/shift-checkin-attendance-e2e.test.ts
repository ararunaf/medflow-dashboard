/**
 * F4-S4 — check-in/check-out real de plantão, contra o Supabase de staging
 * REAL, com sessão de profissional REALMENTE assinada (não service_role) —
 * exatamente o cenário que expôs o bug de `sync_shift_status_from_assignment`
 * (corrigido em 20260903110000). `complete_shift_on_checkout` (F4-S4) já
 * nasceu SECURITY DEFINER por causa dessa lição, mas só a verificação
 * empírica com sessão real prova que a lição foi aplicada corretamente —
 * não é assunção, é o mesmo padrão de teste que já pegou um bug real uma
 * vez neste projeto.
 *
 * Fluxo: profissional (sessão real, anon key + signInWithPassword)
 * confirma a própria atribuição, faz check-in (atrasado de propósito —
 * plantão começou há ~60min) e check-out — confirma que o check-out
 * conclui o plantão de verdade (shifts.status = 'completed', lido via
 * service_role para ser confiável). Depois, coordenador roda o Check-in
 * Confirmation Agent (reviewAttendance) e confirma que o atraso real é
 * sinalizado com verdict determinístico correto.
 *
 * Cria um tenant dedicado (prefixo "e2e-f4s4-") e limpa tudo ao final.
 * Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import { checkIn, checkOut } from "../../../src/lib/services/operations/attendance.ts";
import { reviewAttendance } from "../../../src/lib/services/operations/attendance-review-service.ts";

const hasSupabase =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("F4-S4 — check-in/check-out real conclui o plantão (sessão de profissional assinada, Supabase real)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let admin: SupabaseClient<Database>;
  let professionalClient: SupabaseClient<Database>;
  let tenantId: string;
  let shiftId: string;
  let assignmentId: string;
  let authUserId: string;
  let profileId: string;
  let professionalId: string;
  let coordinatorAuthUserId: string;
  let coordinatorCtx: ServiceCtx;

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    admin = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await admin
      .from("tenants")
      .insert({ name: `E2E F4-S4 ${suffix}`, slug: `e2e-f4s4-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    const hospital = await admin
      .from("hospitals")
      .insert({ tenant_id: tenantId, name: "E2E Hospital F4-S4" })
      .select("id")
      .single();
    if (hospital.error) throw new Error(`setup hospital: ${hospital.error.message}`);

    const unit = await admin
      .from("units")
      .insert({ tenant_id: tenantId, hospital_id: hospital.data.id, name: "E2E Unidade" })
      .select("id")
      .single();
    if (unit.error) throw new Error(`setup unit: ${unit.error.message}`);

    const department = await admin
      .from("departments")
      .insert({ tenant_id: tenantId, unit_id: unit.data.id, name: "E2E Departamento" })
      .select("id")
      .single();
    if (department.error) throw new Error(`setup department: ${department.error.message}`);

    const schedule = await admin
      .from("schedules")
      .insert({
        tenant_id: tenantId,
        department_id: department.data.id,
        name: "E2E Escala",
        start_date: "2026-01-01",
        end_date: "2026-12-31",
      })
      .select("id")
      .single();
    if (schedule.error) throw new Error(`setup schedule: ${schedule.error.message}`);

    // Plantão de 1h, começou há ~60min e terminou há ~5min — já elegível
    // para revisão de presença, e o check-in "agora" será realisticamente
    // atrasado (~60min), sem precisar controlar o relógio do teste.
    const now = Date.now();
    const startsAt = new Date(now - 60 * 60_000).toISOString();
    const endsAt = new Date(now - 5 * 60_000).toISOString();
    const shift = await admin
      .from("shifts")
      .insert({
        tenant_id: tenantId,
        schedule_id: schedule.data.id,
        department_id: department.data.id,
        starts_at: startsAt,
        ends_at: endsAt,
      })
      .select("id, status")
      .single();
    if (shift.error) throw new Error(`setup shift: ${shift.error.message}`);
    shiftId = shift.data.id;
    assert.equal(shift.data.status, "open");

    const email = `e2e-f4s4-${suffix}@example.invalid`;
    const password = `Test-${suffix}-!Aa1`;
    const authUser = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (authUser.error || !authUser.data.user) throw new Error(`setup auth user: ${authUser.error?.message}`);
    authUserId = authUser.data.user.id;

    const profile = await admin
      .from("profiles")
      .insert({ id: authUserId, tenant_id: tenantId, full_name: "E2E F4-S4 Profissional", role: "professional" })
      .select("id")
      .single();
    if (profile.error) throw new Error(`setup profile: ${profile.error.message}`);
    profileId = profile.data.id;

    const professional = await admin
      .from("professionals")
      .insert({ tenant_id: tenantId, profile_id: profileId, specialty: "Clínica Médica", crm: "SP-777777" })
      .select("id")
      .single();
    if (professional.error) throw new Error(`setup professional: ${professional.error.message}`);
    professionalId = professional.data.id;

    // Sessão REAL de profissional — anon key + signInWithPassword, não service_role.
    const { createClient: createAnonClient } = await import("@supabase/supabase-js");
    professionalClient = createAnonClient<Database>(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const signIn = await professionalClient.auth.signInWithPassword({ email, password });
    if (signIn.error) throw new Error(`sign in as professional: ${signIn.error.message}`);

    // Confirma a atribuição diretamente (via professionalClient, RLS real)
    // — não usa selfAssignOpenShift para não depender do estado do shift
    // continuar 'open' até aqui; o que este teste quer provar é o
    // check-in/check-out, não a auto-atribuição (já coberta no F4-S1).
    const created = await professionalClient
      .from("shift_assignments")
      .insert({ tenant_id: tenantId, shift_id: shiftId, professional_id: professionalId, assignment_status: "pending" })
      .select("id")
      .single();
    if (created.error) throw new Error(`create assignment: ${created.error.message}`);
    assignmentId = created.data.id;

    const confirmed = await professionalClient
      .from("shift_assignments")
      .update({ assignment_status: "confirmed" })
      .eq("id", assignmentId);
    if (confirmed.error) throw new Error(`confirm assignment: ${confirmed.error.message}`);

    const coordAuthUser = await admin.auth.admin.createUser({
      email: `e2e-f4s4-coord-${suffix}@example.invalid`,
      password: `Test-${suffix}-coord-!Aa1`,
      email_confirm: true,
    });
    if (coordAuthUser.error || !coordAuthUser.data.user) {
      throw new Error(`setup coordinator auth user: ${coordAuthUser.error?.message}`);
    }
    coordinatorAuthUserId = coordAuthUser.data.user.id;
    const coordProfile = await admin
      .from("profiles")
      .insert({
        id: coordAuthUser.data.user.id,
        tenant_id: tenantId,
        full_name: "E2E F4-S4 Coordenador",
        role: "coordinator",
      })
      .select("id")
      .single();
    if (coordProfile.error) throw new Error(`setup coordinator profile: ${coordProfile.error.message}`);

    coordinatorCtx = {
      client: admin,
      tenantId,
      role: "coordinator",
      userId: coordinatorAuthUserId,
      actorProfileId: coordProfile.data.id,
      professionalId: null,
    };
  });

  after(async () => {
    if (!admin || !tenantId) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["shift_assignments", () => admin.from("shift_assignments").delete().eq("tenant_id", tenantId)],
      ["shifts", () => admin.from("shifts").delete().eq("tenant_id", tenantId)],
      ["schedules", () => admin.from("schedules").delete().eq("tenant_id", tenantId)],
      ["departments", () => admin.from("departments").delete().eq("tenant_id", tenantId)],
      ["units", () => admin.from("units").delete().eq("tenant_id", tenantId)],
      ["hospitals", () => admin.from("hospitals").delete().eq("tenant_id", tenantId)],
      ["operational_events", () => admin.from("operational_events").delete().eq("tenant_id", tenantId)],
    ];
    for (const [label, run] of steps) {
      const { error } = await run();
      if (error) console.warn(`[E2E cleanup] ${label}: ${error.message}`);
    }
    for (const id of [authUserId, coordinatorAuthUserId].filter((x): x is string => Boolean(x))) {
      const del = await admin.auth.admin.deleteUser(id);
      if (del.error) console.warn(`[E2E cleanup] auth user ${id}: ${del.error.message}`);
    }
    const { error: tenantErr } = await admin.from("tenants").delete().eq("id", tenantId);
    if (tenantErr) console.warn(`[E2E cleanup] tenant: ${tenantErr.message}`);
  });

  it("check-in/check-out real via sessão de profissional conclui o plantão e é sinalizado pela revisão", async () => {
    const professionalCtx: ServiceCtx = {
      client: professionalClient,
      tenantId,
      role: "professional",
      userId: authUserId,
      actorProfileId: profileId,
      professionalId,
    };

    const afterCheckIn = await checkIn(professionalCtx, assignmentId);
    assert.ok(afterCheckIn.checked_in_at, "checked_in_at deve estar preenchido");

    // Idempotente: checar de novo não sobrescreve o horário.
    const secondCheckIn = await checkIn(professionalCtx, assignmentId);
    assert.equal(secondCheckIn.checked_in_at, afterCheckIn.checked_in_at);

    const afterCheckOut = await checkOut(professionalCtx, assignmentId);
    assert.ok(afterCheckOut.checked_out_at, "checked_out_at deve estar preenchido");

    // O que este teste realmente prova: o trigger complete_shift_on_checkout
    // (SECURITY DEFINER, F4-S4) de fato conclui o shift para uma sessão
    // REAL de profissional — não só para service_role.
    const { data: shiftAfter, error: shiftErr } = await admin.from("shifts").select("status").eq("id", shiftId).single();
    assert.equal(shiftErr, null, shiftErr?.message);
    assert.equal(shiftAfter!.status, "completed", "check-out real deve concluir o plantão (trigger SECURITY DEFINER)");

    // Check-in Confirmation Agent: atraso real (~60min) deve ser sinalizado.
    const review = await reviewAttendance(coordinatorCtx, { lookbackDays: 1 });
    const mine = review.find((r) => r.assignmentId === assignmentId);
    assert.ok(mine, "atribuição deve aparecer na revisão de presença");
    assert.ok(mine!.signals.lateMinutes >= 55, `atraso deveria ser ~60min, foi ${mine!.signals.lateMinutes}`);
    assert.equal(mine!.verdict, "atencao");
    assert.equal(mine!.signals.noShow, false);
    assert.equal(mine!.signals.missingCheckout, false);
  });
});
