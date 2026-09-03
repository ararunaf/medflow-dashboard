/**
 * F5-S1 — grupos de trabalho, contra o Supabase de staging real: cria
 * grupos, atribui profissionais, prova RBAC (profissional não gerencia) e
 * confirma que a FK composta `professionals_tenant_work_group_fk` com
 * `ON DELETE SET NULL` realmente só zera `work_group_id` quando o grupo é
 * apagado — não corrompe `tenant_id` (achado real de FK composta com
 * SET NULL merece verificação empírica, não suposição, mesmo já existindo
 * o mesmo padrão em `tiss_guides_tenant_hospital_fk` desde o F1-S2).
 *
 * Cria um tenant dedicado (prefixo "e2e-f5s1-") e limpa tudo ao final.
 * Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import {
  createWorkGroup,
  listProfessionalWorkGroupAssignments,
  listWorkGroups,
  setProfessionalWorkGroup,
} from "../../../src/lib/services/operations/work-groups.ts";
import { PermissionError } from "../../../src/lib/domain/operations/errors.ts";

const hasSupabase = Boolean(process.env.VITE_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("F5-S1 — grupos de trabalho (Supabase real de staging)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let client: SupabaseClient<Database>;
  let tenantId: string;
  let professionalAId: string;
  let professionalBId: string;
  const authUserIds: string[] = [];
  let coordinatorCtx: ServiceCtx;
  let professionalCtx: ServiceCtx;

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await client
      .from("tenants")
      .insert({ name: `E2E F5-S1 ${suffix}`, slug: `e2e-f5s1-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    async function makeProfessional(label: string, role: "coordinator" | "professional") {
      const authUser = await client.auth.admin.createUser({
        email: `e2e-f5s1-${label}-${suffix}@example.invalid`,
        password: `Test-${suffix}-${label}-!Aa1`,
        email_confirm: true,
      });
      if (authUser.error || !authUser.data.user) throw new Error(`setup auth user ${label}: ${authUser.error?.message}`);
      authUserIds.push(authUser.data.user.id);

      const profile = await client
        .from("profiles")
        .insert({ id: authUser.data.user.id, tenant_id: tenantId, full_name: `E2E F5-S1 ${label}`, role })
        .select("id")
        .single();
      if (profile.error) throw new Error(`setup profile ${label}: ${profile.error.message}`);

      const professional = await client
        .from("professionals")
        .insert({ tenant_id: tenantId, profile_id: profile.data.id, specialty: "Clínica Médica", crm: `SP-${label}${suffix}` })
        .select("id")
        .single();
      if (professional.error) throw new Error(`setup professional ${label}: ${professional.error.message}`);
      return { professionalId: professional.data.id, authUserId: authUser.data.user.id, profileId: profile.data.id };
    }

    const a = await makeProfessional("a", "professional");
    professionalAId = a.professionalId;
    const b = await makeProfessional("b", "professional");
    professionalBId = b.professionalId;
    const coord = await makeProfessional("coord", "coordinator");

    coordinatorCtx = {
      client,
      tenantId,
      role: "coordinator",
      userId: coord.authUserId,
      actorProfileId: coord.profileId,
      professionalId: coord.professionalId,
    };
    professionalCtx = {
      client,
      tenantId,
      role: "professional",
      userId: a.authUserId,
      actorProfileId: a.profileId,
      professionalId: a.professionalId,
    };
  });

  after(async () => {
    if (!client || !tenantId) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["professionals (work_group_id)", () =>
        client.from("professionals").update({ work_group_id: null }).eq("tenant_id", tenantId)],
      ["work_groups", () => client.from("work_groups").delete().eq("tenant_id", tenantId)],
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

  it("RBAC: profissional não pode criar grupo nem atribuir profissional", async () => {
    await assert.rejects(
      () => createWorkGroup(professionalCtx, "Grupo Indevido"),
      (err: unknown) => err instanceof PermissionError,
    );
    await assert.rejects(
      () => setProfessionalWorkGroup(professionalCtx, { professionalId: professionalAId, workGroupId: null }),
      (err: unknown) => err instanceof PermissionError,
    );
  });

  it("coordenador cria grupos e atribui profissionais; listagem reflete corretamente", async () => {
    const groupUti = await createWorkGroup(coordinatorCtx, "UTI");
    const groupPs = await createWorkGroup(coordinatorCtx, "Pronto-Socorro");

    const groups = await listWorkGroups(coordinatorCtx);
    assert.ok(groups.some((g) => g.workGroupId === groupUti.workGroupId));
    assert.ok(groups.some((g) => g.workGroupId === groupPs.workGroupId));

    await setProfessionalWorkGroup(coordinatorCtx, { professionalId: professionalAId, workGroupId: groupUti.workGroupId });
    await setProfessionalWorkGroup(coordinatorCtx, { professionalId: professionalBId, workGroupId: groupPs.workGroupId });

    const assignments = await listProfessionalWorkGroupAssignments(coordinatorCtx);
    const a = assignments.find((x) => x.professionalId === professionalAId);
    const b = assignments.find((x) => x.professionalId === professionalBId);
    assert.equal(a?.workGroupName, "UTI");
    assert.equal(b?.workGroupName, "Pronto-Socorro");

    // Reatribuir move o profissional para outro grupo, não duplica.
    await setProfessionalWorkGroup(coordinatorCtx, { professionalId: professionalAId, workGroupId: groupPs.workGroupId });
    const reassigned = await listProfessionalWorkGroupAssignments(coordinatorCtx);
    assert.equal(reassigned.find((x) => x.professionalId === professionalAId)?.workGroupName, "Pronto-Socorro");

    // Voltar a "sem grupo" (workGroupId: null) explicitamente.
    await setProfessionalWorkGroup(coordinatorCtx, { professionalId: professionalAId, workGroupId: null });
    const unassigned = await listProfessionalWorkGroupAssignments(coordinatorCtx);
    assert.equal(unassigned.find((x) => x.professionalId === professionalAId)?.workGroupId, null);
  });

  it("apagar um grupo zera work_group_id do profissional (ON DELETE SET NULL) sem corromper tenant_id", async () => {
    const group = await createWorkGroup(coordinatorCtx, "Grupo Temporário");
    await setProfessionalWorkGroup(coordinatorCtx, { professionalId: professionalBId, workGroupId: group.workGroupId });

    const before = await client.from("professionals").select("tenant_id, work_group_id").eq("id", professionalBId).single();
    assert.equal(before.error, null, before.error?.message);
    assert.equal(before.data!.work_group_id, group.workGroupId);
    assert.equal(before.data!.tenant_id, tenantId);

    const del = await client.from("work_groups").delete().eq("id", group.workGroupId);
    assert.equal(del.error, null, del.error?.message);

    const after = await client.from("professionals").select("tenant_id, work_group_id").eq("id", professionalBId).single();
    assert.equal(after.error, null, after.error?.message);
    assert.equal(after.data!.work_group_id, null, "work_group_id deve zerar quando o grupo é apagado");
    assert.equal(after.data!.tenant_id, tenantId, "tenant_id NUNCA deve ser afetado pelo ON DELETE SET NULL da FK composta");
  });
});
