import { assertCan } from "@/lib/auth/rbac";
import type { Database } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { clampJsonMetadata, clampMessage } from "@/lib/services/resilience/resilience-service";
import type {
  PilotContext,
  ReportPilotIncidentInput,
  UpdatePilotIncidentInput,
} from "./pilot-execution-types";

type PilotIncidentUpdate = Database["public"]["Tables"]["pilot_incidents"]["Update"];

function contextFields(ctx?: PilotContext) {
  return {
    context_route: ctx?.route?.slice(0, 256) ?? null,
    context_module: ctx?.module?.slice(0, 64) ?? null,
  };
}

export async function reportPilotIncident(
  ctx: ServiceCtx,
  input: ReportPilotIncidentInput,
): Promise<{ id: string }> {
  const row = {
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
    category: input.category.slice(0, 64),
    severity: input.severity,
    description: clampMessage(input.description, 4096),
    operational_source: input.operationalSource.slice(0, 64),
    incident_status: "open" as const,
    follow_up_status: "pending" as const,
    metadata: clampJsonMetadata({ role: ctx.role }),
    ...contextFields(input.context),
  };
  const { data, error } = await ctx.client
    .from("pilot_incidents")
    .insert(row)
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function listPilotIncidents(ctx: ServiceCtx, limit = 50) {
  const { data, error } = await ctx.client
    .from("pilot_incidents")
    .select(
      "id, category, severity, description, incident_status, operational_source, resolution_notes, follow_up_status, context_route, context_module, created_at, updated_at, resolved_at, actor_profile_id",
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function updatePilotIncident(ctx: ServiceCtx, input: UpdatePilotIncidentInput) {
  assertCan(ctx.role, "tenant_settings:write");
  const patch: PilotIncidentUpdate = { updated_at: new Date().toISOString() };
  if (input.incidentStatus) patch.incident_status = input.incidentStatus;
  if (input.followUpStatus) patch.follow_up_status = input.followUpStatus;
  if (input.resolutionNotes !== undefined) {
    patch.resolution_notes = input.resolutionNotes
      ? clampMessage(input.resolutionNotes, 4096)
      : null;
  }
  if (input.incidentStatus === "resolved" || input.incidentStatus === "closed") {
    patch.resolved_at = new Date().toISOString();
  }
  const { data, error } = await ctx.client
    .from("pilot_incidents")
    .update(patch)
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.incidentId)
    .select("id, incident_status, follow_up_status, resolution_notes, resolved_at")
    .single();
  if (error) throw error;
  return data;
}

export type PilotIncidentExportRow = Awaited<ReturnType<typeof listPilotIncidents>>[number];

export function buildPilotIncidentsExport(args: {
  tenantId: string;
  incidents: PilotIncidentExportRow[];
}): {
  kind: "medflow_pilot_incidents_v1";
  generatedAt: string;
  tenantId: string;
  count: number;
  incidents: PilotIncidentExportRow[];
} {
  return {
    kind: "medflow_pilot_incidents_v1",
    generatedAt: new Date().toISOString(),
    tenantId: args.tenantId,
    count: args.incidents.length,
    incidents: args.incidents,
  };
}

export function countOpenIncidents(incidents: { incident_status: string; severity: string }[]): {
  open: number;
  critical: number;
} {
  let open = 0;
  let critical = 0;
  for (const i of incidents) {
    if (i.incident_status === "open" || i.incident_status === "investigating") {
      open += 1;
      if (i.severity === "critical" || i.severity === "high") critical += 1;
    }
  }
  return { open, critical };
}
