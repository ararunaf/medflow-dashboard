#!/usr/bin/env -S npx tsx
/**
 * Seed de demonstração do tenant `medflow-v1-demo` (MedicFlow-AI V1 Demo).
 *
 * Popula o Pega Plantão (instituições, profissionais, escalas, plantões,
 * atribuições, check-in/out, trocas, disponibilidade, grupos de trabalho) e o
 * Processamento de Guias (guias TISS, lotes, XML, retornos, glosas, recursos,
 * produção, repasses, fechamento, conciliação, Captura Inteligente com o
 * pipeline real e revisão de regras contratuais).
 *
 * Sempre que existe um service da aplicação, ele é usado (mesmas validações,
 * criptografia de nome de paciente, máquinas de estado e eventos). Histórico
 * passado (plantões já realizados) é gravado direto na tabela respeitando os
 * triggers, com timestamps retroativos.
 *
 * Requer VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (+ MEDFLOW_OPENAI_API_KEY
 * para o pipeline de captura e a esteira de contrato) no .env.local.
 *
 * Uso:
 *   npx tsx scripts/demo/seed-demo-tenant.ts --phase=base,shifts,tiss
 *   npx tsx scripts/demo/seed-demo-tenant.ts --phase=contract,contract-review
 *   npx tsx scripts/demo/seed-demo-tenant.ts --phase=capture
 *   (sem --phase = todas, nesta ordem). --dry-run só imprime o plano de plantões.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  assignmentCheckedInEvent,
  assignmentCheckedOutEvent,
  assignmentConfirmedEvent,
  assignmentRejectedEvent,
  shiftCancelledEvent,
} from "@/lib/operations/timeline";
import { createSchedule } from "@/lib/services/operations/schedules";
import { selfAssignOpenShift } from "@/lib/services/operations/assignments";
import { checkIn } from "@/lib/services/operations/attendance";
import { approveSwap, denySwap, requestSwap } from "@/lib/services/operations/swaps";
import { updateAvailability } from "@/lib/services/operations/availability";
import { setProfessionalHospitalAffiliation } from "@/lib/services/operations/institutions";
import { createWorkGroup, listWorkGroups, setProfessionalWorkGroup } from "@/lib/services/operations/work-groups";
import { addTissGuideItem, createTissGuide, setTissGuideStatus } from "@/lib/services/tiss/guide-service";
import { assignGuideToBatch, closeTissBatch, createTissBatch } from "@/lib/services/tiss/batch-service";
import { exportTissBatchXml } from "@/lib/services/tiss/xml-export-service";
import { createTissReturn, updateTissReturnStatus } from "@/lib/services/tiss/return-processing-service";
import { createTissDenial, updateTissDenialStatus } from "@/lib/services/tiss/denial-service";
import { createTissDenialAppeal, updateTissDenialAppealStatus } from "@/lib/services/tiss/denial-appeal-service";
import { setInsuranceProviderHomologationStatus } from "@/lib/services/tiss/homologation-service";
import { createPayoutRule, ensureDraftMedicalPayout, markMedicalPayoutApproved, markMedicalPayoutPaid, markMedicalPayoutReviewed } from "@/lib/services/medical-payout/payout-service";
import { calculateMedicalPayout } from "@/lib/services/medical-payout/payout-calculation-service";
import { syncMedicalProductionForCompetence } from "@/lib/services/medical-payout/production-service";
import { ensureDraftClosingForCompetence, refreshClosingTotalsFromOperationalData, transitionFinancialClosingStatus } from "@/lib/services/financial-closing/financial-closing-service";
import { ensureDraftReconciliationForCompetence, linkReconciliationToClosing } from "@/lib/services/reconciliation/reconciliation-service";
import { runOperationalMatching } from "@/lib/services/reconciliation/reconciliation-matching-service";
import { applyCsvImportToReconciliation } from "@/lib/services/reconciliation/reconciliation-import-service";
import { createCaptureSession, uploadCaptureDocument, getCaptureSession } from "@/lib/capture/infrastructure/capture-session-store";
import { enqueueCapturePipelineJob } from "@/lib/capture/infrastructure/capture-pipeline-queue";
import { processCapturePipelineJob } from "@/lib/capture/infrastructure/capture-pipeline-runtime";
import { setReviewApprovalViaEnterprise } from "@/lib/capture/enterprise/process-review-via-enterprise";
import { getCaptureCorrectionProposalsViaEnterprise, updateCaptureCorrectionProposalViaEnterprise } from "@/lib/capture/enterprise/process-correction-via-enterprise";
import { recordCaptureLearningDecision } from "@/lib/capture/learning/services/learning-loop-service";
import { resolveProcessingQueue } from "@/lib/capture/processing/queue-mapper";
import { listContractRuleProposals, reviewContractRuleProposal } from "@/lib/capture/contract/review/contract-rule-review-service";
import { CONTRACT_CATEGORY_RETRIEVAL_QUERIES, extractContractRulesForCategory } from "@/lib/capture/contract/engine/contract-knowledge-agent";
import { CONTRACT_RULE_CATEGORIES } from "@/lib/capture/contract/types/contract-rule-proposal";
import { createAIProviderFactory } from "@/lib/enterprise/ai-provider/factory/ai-provider-factory";
import { embedQuery } from "@/lib/rag/embed-texts";
import * as D from "./demo-dataset.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");

type Admin = ReturnType<typeof createClient<Database>>;
type ShiftRow = Database["public"]["Tables"]["shifts"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["shift_assignments"]["Row"];

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo@MedicFlow2026";
const NOW = new Date();
const DAY_MS = 86_400_000;

// ---------------------------------------------------------------------------
// utilidades
// ---------------------------------------------------------------------------

function loadEnv(): void {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const m = raw.trim().match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260925);
const chance = (p: number) => rnd() < p;
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const randInt = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

/** "2026-09-25" + "07:00" (horário de Brasília) → ISO UTC. */
function localIso(date: string, hm: string, plusMinutes = 0): string {
  return new Date(new Date(`${date}T${hm}:00-03:00`).getTime() + plusMinutes * 60_000).toISOString();
}
function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00-03:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function weekday(date: string): number {
  return new Date(`${date}T12:00:00-03:00`).getUTCDay();
}
function isoWeek(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  return d.toISOString().slice(0, 10);
}
function shiftIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
function log(...args: unknown[]) {
  console.log("[demo-seed]", ...args);
}
async function maybe<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>, what: string): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}
async function must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>, what: string): Promise<NonNullable<T>> {
  const data = await maybe(p, what);
  if (data === null || data === undefined) throw new Error(`${what}: sem dados`);
  return data as NonNullable<T>;
}

// ---------------------------------------------------------------------------
// contexto
// ---------------------------------------------------------------------------

type Env = {
  admin: Admin;
  tenantId: string;
  profiles: Map<string, string>; // handle -> profile id
  professionals: Map<string, { id: string; profileId: string; spec: (typeof D.DEMO_PROFESSIONALS)[number] }>;
  coord: ServiceCtx;
  fin: ServiceCtx;
  tenantAdmin: ServiceCtx;
};

function ctxFor(env: Pick<Env, "admin" | "tenantId">, profileId: string, role: UserRole, professionalId: string | null = null): ServiceCtx {
  return { client: env.admin, tenantId: env.tenantId, role, userId: profileId, actorProfileId: profileId, professionalId };
}

function proCtx(env: Env, handle: string): ServiceCtx {
  const p = env.professionals.get(handle)!;
  return ctxFor(env, p.profileId, "professional", p.id);
}

async function findAuthUserIdByEmail(admin: Admin, email: string): Promise<string | null> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}

async function ensureUser(env: Pick<Env, "admin" | "tenantId">, handle: string, fullName: string, role: UserRole): Promise<string> {
  const email = `${handle}@${D.DEMO_EMAIL_DOMAIN}`;
  let userId: string | null = null;
  const created = await env.admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, demo_seed: true },
  });
  if (created.error) {
    userId = await findAuthUserIdByEmail(env.admin, email);
    if (!userId) throw new Error(`createUser ${email}: ${created.error.message}`);
  } else {
    userId = created.data.user.id;
  }
  const existing = await maybe(env.admin.from("profiles").select("id, tenant_id").eq("id", userId).maybeSingle(), "profile lookup");
  if (existing && existing.tenant_id !== env.tenantId) {
    throw new Error(`Perfil ${email} pertence a outro tenant — abortando.`);
  }
  if (!existing) {
    await maybe(env.admin.from("profiles").insert({ id: userId, tenant_id: env.tenantId, full_name: fullName, role }), `profile ${email}`);
  }
  return userId;
}

async function buildEnv(): Promise<Env> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  const admin = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const tenant = await must(admin.from("tenants").select("id, name").eq("slug", D.DEMO_TENANT_SLUG).single(), "tenant");
  log(`tenant ${tenant.name} (${tenant.id}) @ ${new URL(url).hostname}`);
  const base = { admin, tenantId: tenant.id };

  const profiles = new Map<string, string>();
  for (const s of D.DEMO_STAFF) profiles.set(s.handle, await ensureUser(base, s.handle, s.fullName, s.role as UserRole));
  for (const p of D.DEMO_PROFESSIONALS) profiles.set(p.handle, await ensureUser(base, p.handle, p.fullName, "professional"));

  const adminProfile = await maybe(
    admin.from("profiles").select("id").eq("tenant_id", tenant.id).eq("role", "tenant_admin").order("created_at").limit(1).maybeSingle(),
    "tenant admin",
  );

  const env: Env = {
    ...base,
    profiles,
    professionals: new Map(),
    coord: ctxFor(base, profiles.get("carla.mendes")!, "coordinator"),
    fin: ctxFor(base, profiles.get("rafael.souza")!, "financial"),
    tenantAdmin: ctxFor(base, adminProfile?.id ?? profiles.get("carla.mendes")!, adminProfile ? "tenant_admin" : "coordinator"),
  };

  const pros = await must(admin.from("professionals").select("id, profile_id").eq("tenant_id", tenant.id), "professionals");
  for (const spec of D.DEMO_PROFESSIONALS) {
    const profileId = profiles.get(spec.handle)!;
    const row = pros.find((r) => r.profile_id === profileId);
    if (row) env.professionals.set(spec.handle, { id: row.id, profileId, spec });
  }
  return env;
}

// ---------------------------------------------------------------------------
// fase: base (cadastros)
// ---------------------------------------------------------------------------

type Structure = {
  hospitals: Map<string, string>; // code -> id
  departments: Map<string, { id: string; hospitalCode: string }>; // name -> dept
  providers: Map<string, { id: string; contractId: string | null }>; // key -> provider
  procedures: Map<string, string>; // tuss code -> id
};

const EXTRA_PROCEDURES = [
  { code: "40901106", description: "Ecodopplercardiograma transtorácico", specialty: "Cardiologia", group: "Métodos diagnósticos", value: 250 },
  { code: "40101045", description: "Teste ergométrico convencional - 3 ou mais derivações simultâneas", specialty: "Cardiologia", group: "Métodos diagnósticos", value: 160 },
  { code: "20102038", description: "Monitorização ambulatorial da pressão arterial - MAPA (24 horas)", specialty: "Cardiologia", group: "Métodos diagnósticos", value: 140 },
  { code: "40808033", description: "Mamografia convencional bilateral", specialty: "Radiologia", group: "Imagem", value: 95 },
  { code: "31309127", description: "Parto (via vaginal)", specialty: "Ginecologia e Obstetrícia", group: "Cirurgia", value: 1900 },
  { code: "31602347", description: "Anestesia realizada pelo anestesiologista em atos médicos sem porte específico", specialty: "Anestesiologia", group: "Anestesia", value: 650 },
];
const ALL_PROCEDURES = [...D.DEMO_PROCEDURES, ...EXTRA_PROCEDURES];
const procValue = (code: string) => ALL_PROCEDURES.find((p) => p.code === code)?.value ?? 100;

async function phaseBase(env: Env): Promise<void> {
  const { admin, tenantId } = env;

  // Parametrização TISS da instituição (necessária para exportar XML).
  const settings = await must(admin.from("tenant_settings").select("cnpj, default_regime_atendimento, default_carater_atendimento").eq("tenant_id", tenantId).single(), "settings");
  await maybe(
    admin.from("tenant_settings").update({
      cnpj: settings.cnpj ?? D.DEMO_TENANT_CNPJ,
      default_regime_atendimento: settings.default_regime_atendimento ?? "01",
      default_carater_atendimento: settings.default_carater_atendimento ?? "1",
      support_phone: "(19) 3200-0000",
    }).eq("tenant_id", tenantId),
    "settings update",
  );

  // Instituições → unidades → setores.
  for (const inst of D.DEMO_INSTITUTIONS) {
    let hospital = await maybe(admin.from("hospitals").select("id").eq("tenant_id", tenantId).eq("code", inst.code).maybeSingle(), "hospital");
    if (!hospital) {
      hospital = await must(
        admin.from("hospitals").insert({ tenant_id: tenantId, code: inst.code, name: inst.name, cnes: inst.cnes, cnpj: inst.cnpj, address: inst.address, phone: inst.phone, created_at: "2026-07-01T12:00:00Z" }).select("id").single(),
        "hospital insert",
      );
    }
    for (const u of inst.units) {
      let unit = await maybe(admin.from("units").select("id").eq("tenant_id", tenantId).eq("hospital_id", hospital.id).eq("name", u.name).maybeSingle(), "unit");
      if (!unit) unit = await must(admin.from("units").insert({ tenant_id: tenantId, hospital_id: hospital.id, name: u.name, type: u.type as "hospital" }).select("id").single(), "unit insert");
      for (const dname of u.departments) {
        const dept = await maybe(admin.from("departments").select("id").eq("tenant_id", tenantId).eq("unit_id", unit.id).eq("name", dname).maybeSingle(), "dept");
        if (!dept) await maybe(admin.from("departments").insert({ tenant_id: tenantId, unit_id: unit.id, name: dname }), "dept insert");
      }
    }
  }
  log("instituições/unidades/setores ok");

  // Grupos de trabalho.
  const groups = await listWorkGroups(env.coord);
  for (const name of D.DEMO_WORK_GROUPS) {
    if (!groups.some((g) => g.name === name)) groups.push(await createWorkGroup(env.coord, name));
  }
  const groupId = (name: string) => groups.find((g) => g.name === name)!.workGroupId;

  // Profissionais (+ grupo, afiliações, disponibilidade).
  const structure = await loadStructure(env);
  for (const spec of D.DEMO_PROFESSIONALS) {
    const profileId = env.profiles.get(spec.handle)!;
    let pro = env.professionals.get(spec.handle);
    if (!pro) {
      const row = await must(
        admin.from("professionals").insert({ tenant_id: tenantId, profile_id: profileId, specialty: spec.specialty, crm: spec.crm, cbo_code: spec.cbo }).select("id").single(),
        `professional ${spec.handle}`,
      );
      pro = { id: row.id, profileId, spec };
      env.professionals.set(spec.handle, pro);
    }
    await setProfessionalWorkGroup(env.coord, { professionalId: pro.id, workGroupId: groupId(spec.group) });
    for (const code of spec.hospitals) {
      await setProfessionalHospitalAffiliation(env.coord, { professionalId: pro.id, hospitalId: structure.hospitals.get(code)!, active: true });
    }
    await updateAvailability(env.coord, {
      professionalId: pro.id,
      windows: spec.days.map((weekday: number) => ({ weekday, startTime: spec.hours[0], endTime: spec.hours[1], available: true })),
    });
  }
  log(`${env.professionals.size} profissionais ok`);

  // Operadoras + contratos + homologação.
  for (const op of D.DEMO_OPERATORS) {
    let prov = await maybe(admin.from("insurance_providers").select("id").eq("tenant_id", tenantId).eq("ans_code", op.ans).maybeSingle(), "provider");
    if (!prov) prov = await must(admin.from("insurance_providers").insert({ tenant_id: tenantId, name: op.name, ans_code: op.ans, active: true }).select("id").single(), "provider insert");
    const contract = await maybe(admin.from("insurance_contracts").select("id").eq("tenant_id", tenantId).eq("contract_number", op.contract).maybeSingle(), "contract");
    if (!contract) await maybe(admin.from("insurance_contracts").insert({ tenant_id: tenantId, insurance_provider_id: prov.id, name: op.contractName, contract_number: op.contract, active: true }), "contract insert");
  }
  const homolog: Array<[string, string, string]> = [
    ["412345", "homologated", "Homologação concluída em 18/08/2026 — lote-piloto aceito sem rejeições de schema."],
    ["398765", "in_progress", "Lote-teste enviado em 12/09/2026; aguardando parecer técnico da operadora."],
  ];
  for (const [ans, status, notes] of homolog) {
    const prov = await must(admin.from("insurance_providers").select("id, homologation_status").eq("tenant_id", tenantId).eq("ans_code", ans).single(), "provider");
    if (prov.homologation_status === "not_started") {
      try {
        await setInsuranceProviderHomologationStatus(env.tenantAdmin, { providerId: prov.id, status, notes } as never);
      } catch (err) {
        log("homologação (ignorado):", (err as Error).message);
      }
    }
  }
  log("operadoras/contratos ok");

  // Procedimentos TUSS (catálogo operacional compartilhado — só insere os ausentes).
  const existing = await must(admin.from("tuss_procedures").select("code").in("code", ALL_PROCEDURES.map((p) => p.code)), "tuss");
  const missing = ALL_PROCEDURES.filter((p) => !existing.some((e) => e.code === p.code));
  if (missing.length) {
    await maybe(
      admin.from("tuss_procedures").insert(missing.map((p) => ({ code: p.code, description: p.description, specialty: p.specialty, operational_group: p.group, default_value: p.value, active: true }))),
      "tuss insert",
    );
  }
  log(`TUSS: ${missing.length} procedimento(s) adicionados ao catálogo operacional`);

  // Regras de repasse / retenção.
  const rules = await must(admin.from("payout_rules").select("id").eq("tenant_id", tenantId), "payout rules");
  if (rules.length === 0) {
    const hz = structure.providers.get("horizonte") ?? (await loadStructure(env)).providers.get("horizonte");
    await createPayoutRule(env.fin, { payout_type: "percentage", payout_percentage: 80, specialty: "" });
    await createPayoutRule(env.fin, { payout_type: "percentage", payout_percentage: 85, specialty: "Medicina Intensiva" });
    await createPayoutRule(env.fin, { payout_type: "percentage", payout_percentage: 82, insurance_provider_id: hz?.id ?? null });
    await createPayoutRule(env.fin, { payout_type: "retention_percentage", payout_percentage: 5, specialty: "" });
    await createPayoutRule(env.fin, { payout_type: "retention_fixed", fixed_value: 35, specialty: "" });
    log("regras de repasse ok");
  }
}

async function loadStructure(env: Env): Promise<Structure> {
  const { admin, tenantId } = env;
  const hospitals = await must(admin.from("hospitals").select("id, code").eq("tenant_id", tenantId), "hospitals");
  const units = await must(admin.from("units").select("id, hospital_id").eq("tenant_id", tenantId), "units");
  const depts = await must(admin.from("departments").select("id, name, unit_id").eq("tenant_id", tenantId), "departments");
  const providers = await must(admin.from("insurance_providers").select("id, ans_code").eq("tenant_id", tenantId), "providers");
  const contracts = await must(admin.from("insurance_contracts").select("id, insurance_provider_id").eq("tenant_id", tenantId), "contracts");
  const procs = await must(admin.from("tuss_procedures").select("id, code").in("code", ALL_PROCEDURES.map((p) => p.code)), "tuss");

  const s: Structure = { hospitals: new Map(), departments: new Map(), providers: new Map(), procedures: new Map() };
  for (const h of hospitals) s.hospitals.set(h.code, h.id);
  for (const d of depts) {
    const unit = units.find((u) => u.id === d.unit_id);
    const code = hospitals.find((h) => h.id === unit?.hospital_id)?.code ?? "";
    s.departments.set(d.name, { id: d.id, hospitalCode: code });
  }
  const ansToKey: Record<string, string> = { "412345": "horizonte", "398765": "vitalis", "999999": "alfa", "888888": "beta" };
  for (const p of providers) {
    const key = ansToKey[p.ans_code];
    if (key) s.providers.set(key, { id: p.id, contractId: contracts.find((c) => c.insurance_provider_id === p.id)?.id ?? null });
  }
  for (const p of procs) s.procedures.set(p.code, p.id);
  return s;
}

// ---------------------------------------------------------------------------
// fase: shifts (Pega Plantão / Escalas)
// ---------------------------------------------------------------------------

const SHIFT_WINDOW_START = "2026-09-04";
const SHIFT_WINDOW_END = "2026-10-31";
const PLANNING_WEEK = ["2026-11-02", "2026-11-08"];

type ShiftPlan = {
  department: string;
  role: string;
  date: string;
  startsAt: string;
  endsAt: string;
  kind: "past" | "current" | "future" | "planning";
  outcome: "completed" | "no_show" | "missing_checkout" | "in_progress" | "confirmed" | "pending" | "open" | "cancelled";
  pro: string | null;
  checkInOffset: number;
  checkOutOffset: number;
  rejectedBy: string | null;
};

function planShifts(structure: Structure): ShiftPlan[] {
  const plans: ShiftPlan[] = [];
  const busy = new Map<string, Array<[number, number]>>();
  const weekLoad = new Map<string, number>();

  const eligible = (role: string, hospitalCode: string) =>
    D.DEMO_PROFESSIONALS.filter((p) => p.specialty === role && p.hospitals.includes(hospitalCode));

  const canTake = (handle: string, start: number, end: number, week: string, cap: number) => {
    if ((weekLoad.get(`${handle}|${week}`) ?? 0) >= cap) return false;
    const rest = 11 * 3_600_000;
    return !(busy.get(handle) ?? []).some(([s, e]) => start < e + rest && end + rest > s);
  };

  const dates: string[] = [];
  for (let d = SHIFT_WINDOW_START; d <= PLANNING_WEEK[1]!; d = addDays(d, 1)) {
    if (d > SHIFT_WINDOW_END && d < PLANNING_WEEK[0]!) continue;
    dates.push(d);
  }

  for (const date of dates) {
    for (const grid of D.DEMO_SHIFT_GRID) {
      if (grid.weekdays && !grid.weekdays.includes(weekday(date))) continue;
      const dept = structure.departments.get(grid.department);
      if (!dept) throw new Error(`Setor ${grid.department} não encontrado — rode a fase base.`);
      for (const [hm, hours] of grid.slots) {
        const startsAt = localIso(date, hm as string);
        const endsAt = shiftIso(startsAt, (hours as number) * 60);
        const start = new Date(startsAt).getTime();
        const end = new Date(endsAt).getTime();
        const planning = date >= PLANNING_WEEK[0]!;
        const kind: ShiftPlan["kind"] = planning ? "planning" : end <= NOW.getTime() ? "past" : start <= NOW.getTime() ? "current" : "future";
        const daysAhead = (start - NOW.getTime()) / DAY_MS;

        const plan: ShiftPlan = { department: grid.department, role: grid.role, date, startsAt, endsAt, kind, outcome: "open", pro: null, checkInOffset: 0, checkOutOffset: 0, rejectedBy: null };

        if (kind === "planning") {
          plans.push(plan);
          continue;
        }

        // Probabilidade de cobertura decresce com a distância no futuro.
        let fill = 1;
        let pendingShare = 0;
        if (kind === "future") {
          if (daysAhead <= 3) { fill = 0.9; pendingShare = 0.08; }
          else if (daysAhead <= 14) { fill = 0.82; pendingShare = 0.18; }
          else { fill = 0.55; pendingShare = 0.25; }
        }
        if (kind === "past" && chance(0.02)) {
          plan.outcome = "cancelled";
          plans.push(plan);
          continue;
        }

        const week = isoWeek(date);
        const cap = kind === "future" ? 5 : 6;
        const candidates = eligible(grid.role, dept.hospitalCode)
          .filter((p) => canTake(p.handle, start, end, week, cap))
          .sort((a, b) => {
            const avA = a.days.includes(weekday(date)) ? 0 : 1;
            const avB = b.days.includes(weekday(date)) ? 0 : 1;
            if (avA !== avB) return avA - avB;
            return (weekLoad.get(`${a.handle}|${week}`) ?? 0) - (weekLoad.get(`${b.handle}|${week}`) ?? 0) || rnd() - 0.5;
          });

        const chosen = candidates[0];
        if (!chosen || !chance(fill)) {
          if (kind === "past") plan.outcome = "cancelled";
          else if (chosen && chance(0.3)) plan.rejectedBy = chosen.handle;
          plans.push(plan);
          continue;
        }

        busy.set(chosen.handle, [...(busy.get(chosen.handle) ?? []), [start, end]]);
        weekLoad.set(`${chosen.handle}|${week}`, (weekLoad.get(`${chosen.handle}|${week}`) ?? 0) + 1);
        plan.pro = chosen.handle;

        if (kind === "past") {
          plan.outcome = "completed";
          plan.checkInOffset = -randInt(0, 20);
          plan.checkOutOffset = randInt(-5, 25);
          if (chance(0.08)) plan.checkInOffset = randInt(16, 55); // atraso
          if (chance(0.04)) plan.checkOutOffset = -randInt(45, 120); // saída antecipada
        } else if (kind === "current") {
          plan.outcome = "in_progress";
        } else {
          plan.outcome = chance(pendingShare / fill) ? "pending" : "confirmed";
        }
        plans.push(plan);
      }
    }
  }

  // Anomalias de presença para o Check-in Confirmation Agent (últimos dias).
  const recentPast = plans.filter((p) => p.outcome === "completed" && new Date(p.endsAt).getTime() > NOW.getTime() - 9 * DAY_MS);
  const shuffled = recentPast.sort(() => rnd() - 0.5);
  shuffled.slice(0, 2).forEach((p) => (p.outcome = "no_show"));
  shuffled.slice(2, 4).forEach((p) => (p.outcome = "missing_checkout"));
  return plans;
}

async function phaseShifts(env: Env, dryRun: boolean): Promise<void> {
  const { admin, tenantId } = env;
  const structure = await loadStructure(env);

  const existingSchedules = await must(admin.from("schedules").select("id").eq("tenant_id", tenantId).like("name", "%Setembro/2026"), "schedules");
  if (existingSchedules.length && !dryRun) {
    log("fase shifts: escalas já existem — pulando (apague as escalas demo para recriar).");
    return;
  }

  const plans = planShifts(structure);
  const tally = plans.reduce<Record<string, number>>((acc, p) => ((acc[`${p.kind}:${p.outcome}`] = (acc[`${p.kind}:${p.outcome}`] ?? 0) + 1), acc), {});
  log(`plano: ${plans.length} plantões`, tally);
  if (dryRun) return;

  // Escalas mensais por setor (setembro/outubro ativas, novembro em rascunho).
  const months = [
    { label: "Setembro/2026", start: "2026-09-01", end: "2026-09-30", status: "active", createdAt: "2026-08-20T13:00:00Z" },
    { label: "Outubro/2026", start: "2026-10-01", end: "2026-10-31", status: "active", createdAt: "2026-09-15T13:00:00Z" },
    { label: "Novembro/2026", start: "2026-11-01", end: "2026-11-30", status: "draft", createdAt: "2026-09-23T13:00:00Z" },
  ];
  const scheduleFor = new Map<string, string>(); // dept|YYYY-MM -> schedule id
  for (const [deptName, dept] of structure.departments) {
    for (const m of months) {
      const sch = await createSchedule(env.coord, { departmentId: dept.id, name: `${deptName} — ${m.label}`, startDate: m.start, endDate: m.end, status: m.status as "active" });
      await maybe(admin.from("schedules").update({ created_at: m.createdAt }).eq("id", sch.id), "schedule backdate");
      scheduleFor.set(`${deptName}|${m.start.slice(0, 7)}`, sch.id);
    }
  }
  log(`${scheduleFor.size} escalas criadas`);

  // Plantões (insert em lote; created_at = criação da escala).
  const shiftRows: ShiftRow[] = [];
  for (const batch of chunk(plans, 200)) {
    const rows = batch.map((p) => {
      const month = p.date.slice(0, 7);
      const m = months.find((x) => x.start.startsWith(month))!;
      return {
        tenant_id: tenantId,
        schedule_id: scheduleFor.get(`${p.department}|${month}`)!,
        department_id: structure.departments.get(p.department)!.id,
        starts_at: p.startsAt,
        ends_at: p.endsAt,
        role_required: p.role,
        status: "open" as const,
        created_at: m.createdAt,
      };
    });
    shiftRows.push(...(await must(admin.from("shifts").insert(rows).select("*"), "shifts insert")));
  }
  const shiftId = (p: ShiftPlan) =>
    shiftRows.find((s) => s.department_id === structure.departments.get(p.department)!.id && new Date(s.starts_at).getTime() === new Date(p.startsAt).getTime())!.id;
  log(`${shiftRows.length} plantões inseridos`);

  const events: Array<Record<string, unknown>> = [];
  const pushEvent = (payload: { entity_type: string; entity_id: string; event_type: string; severity: string; description: string; metadata: unknown }, at: string, actor: string) => {
    if (new Date(at).getTime() > NOW.getTime()) return;
    events.push({ ...payload, tenant_id: tenantId, actor_profile_id: actor, created_at: at });
  };

  // Atribuições.
  type Pending = { plan: ShiftPlan; row: Record<string, unknown> };
  const toInsert: Pending[] = [];
  for (const p of plans) {
    const sid = shiftId(p);
    if (p.rejectedBy) {
      const pro = env.professionals.get(p.rejectedBy)!;
      const assignedAt = new Date(Math.min(NOW.getTime() - randInt(1, 6) * DAY_MS, new Date(p.startsAt).getTime() - DAY_MS)).toISOString();
      toInsert.push({ plan: { ...p, outcome: "open" }, row: { tenant_id: tenantId, shift_id: sid, professional_id: pro.id, assignment_status: "rejected", assigned_at: assignedAt } });
    }
    if (!p.pro || p.outcome === "cancelled" || p.outcome === "open") continue;
    const pro = env.professionals.get(p.pro)!;
    const start = new Date(p.startsAt).getTime();
    const floor = new Date("2026-08-22T12:00:00Z").getTime();
    const assignedAt = new Date(Math.max(floor, Math.min(NOW.getTime() - 3_600_000, start - randInt(3, 20) * DAY_MS))).toISOString();
    const row: Record<string, unknown> = {
      tenant_id: tenantId,
      shift_id: sid,
      professional_id: pro.id,
      assignment_status: p.outcome === "pending" ? "pending" : "confirmed",
      assigned_at: assignedAt,
    };
    if (["completed", "missing_checkout"].includes(p.outcome)) row.checked_in_at = shiftIso(p.startsAt, p.checkInOffset);
    toInsert.push({ plan: p, row });
  }
  const inserted: Array<{ plan: ShiftPlan; row: AssignmentRow }> = [];
  for (const batch of chunk(toInsert, 200)) {
    const rows = await must(admin.from("shift_assignments").insert(batch.map((b) => b.row) as never).select("*"), "assignments insert");
    rows.forEach((r, i) => inserted.push({ plan: batch[i]!.plan, row: r }));
  }
  log(`${inserted.length} atribuições inseridas`);

  // Check-out histórico (UPDATE dispara a conclusão do plantão).
  let completed = 0;
  for (const { plan, row } of inserted) {
    if (plan.outcome !== "completed") continue;
    const checkedOut = shiftIso(plan.endsAt, plan.checkOutOffset);
    await maybe(admin.from("shift_assignments").update({ checked_out_at: checkedOut }).eq("id", row.id), "checkout");
    completed++;
    const actor = env.professionals.get(plan.pro!)!.profileId;
    if (new Date(plan.endsAt).getTime() > NOW.getTime() - 6 * DAY_MS || plan.checkInOffset > 15 || plan.checkOutOffset < -30) {
      pushEvent(assignmentCheckedInEvent({ ...row, checked_in_at: row.checked_in_at }), row.checked_in_at!, actor);
      pushEvent(assignmentCheckedOutEvent({ ...row, checked_out_at: checkedOut }), checkedOut, actor);
    }
  }
  for (const { plan, row } of inserted) {
    if (row.assignment_status === "confirmed" && new Date(row.assigned_at).getTime() > NOW.getTime() - 10 * DAY_MS) {
      pushEvent(assignmentConfirmedEvent(row), row.assigned_at, env.coord.actorProfileId);
    }
    if (row.assignment_status === "rejected") {
      pushEvent(assignmentRejectedEvent(row), shiftIso(row.assigned_at, randInt(30, 600)), env.professionals.get(plan.rejectedBy ?? "")?.profileId ?? env.coord.actorProfileId);
    }
    if (plan.outcome === "missing_checkout") {
      pushEvent(assignmentCheckedInEvent(row), row.checked_in_at!, env.professionals.get(plan.pro!)!.profileId);
    }
  }
  log(`${completed} plantões concluídos com check-in/out`);

  // Cancelamentos (inclui plantões passados sem cobertura).
  const cancelled = plans.filter((p) => p.outcome === "cancelled");
  for (const p of cancelled) {
    const row = await must(admin.from("shifts").update({ status: "cancelled" }).eq("id", shiftId(p)).select("*").single(), "cancel");
    pushEvent(shiftCancelledEvent(row), shiftIso(p.startsAt, -randInt(24, 72) * 60), env.coord.actorProfileId);
  }
  log(`${cancelled.length} plantões cancelados`);

  // Plantões em andamento agora: check-in real via service.
  for (const { plan, row } of inserted) {
    if (plan.outcome !== "in_progress") continue;
    await checkIn(proCtx(env, plan.pro!), row.id);
  }

  for (const batch of chunk(events, 300)) await maybe(admin.from("operational_events").insert(batch as never), "events");
  log(`${events.length} eventos históricos na timeline`);

  // Ações "ao vivo" pelos services: Pega Plantão (auto-atribuição) e trocas.
  const openFuture = plans
    .filter((p) => p.kind === "future" && p.outcome === "open" && !p.rejectedBy && (new Date(p.startsAt).getTime() - NOW.getTime()) / DAY_MS < 12)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  let selfAssigned = 0;
  for (const p of openFuture) {
    if (selfAssigned >= 4) break;
    const candidate = D.DEMO_PROFESSIONALS.find((x) => x.specialty === p.role && x.hospitals.includes(structure.departments.get(p.department)!.hospitalCode) && !plans.some((o) => o.pro === x.handle && o.date === p.date));
    if (!candidate) continue;
    try {
      await selfAssignOpenShift(proCtx(env, candidate.handle), shiftId(p));
      p.pro = candidate.handle;
      p.outcome = "confirmed";
      selfAssigned++;
    } catch (err) {
      log("auto-atribuição ignorada:", (err as Error).message);
    }
  }
  log(`${selfAssigned} plantões pegos via Pega Plantão (auto-atribuição)`);

  const swapCandidates = plans
    .filter((p) => p.kind === "future" && p.outcome === "confirmed" && p.pro && (new Date(p.startsAt).getTime() - NOW.getTime()) / DAY_MS > 2)
    .sort(() => rnd() - 0.5);
  const swapPlan: Array<"pending" | "approve" | "deny"> = ["pending", "pending", "pending", "approve", "approve", "deny"];
  let swaps = 0;
  for (const p of swapCandidates) {
    if (swaps >= swapPlan.length) break;
    const target = D.DEMO_PROFESSIONALS.find(
      (x) => x.handle !== p.pro && x.specialty === p.role && x.hospitals.includes(structure.departments.get(p.department)!.hospitalCode) && !plans.some((o) => o.pro === x.handle && o.date === p.date),
    );
    if (!target) continue;
    try {
      const swap = await requestSwap(proCtx(env, p.pro!), { shiftId: shiftId(p), targetProfessionalId: env.professionals.get(target.handle)!.id });
      const action = swapPlan[swaps]!;
      if (action === "approve") await approveSwap(env.coord, swap.id);
      if (action === "deny") await denySwap(env.coord, swap.id);
      swaps++;
    } catch (err) {
      log("troca ignorada:", (err as Error).message);
    }
  }
  log(`${swaps} solicitações de troca (3 pendentes, 2 aprovadas, 1 negada)`);
}

// ---------------------------------------------------------------------------
// fase: tiss (guias, lotes, XML, retornos, glosas, recursos, repasses, fechamento)
// ---------------------------------------------------------------------------

const PATIENTS = [
  "Adriana Moura Lins", "Alberto Siqueira Neto", "Aline Barbosa Reis", "Amanda Queiroz Leal", "André Luiz Fontes", "Arthur Menezes Prado",
  "Bianca Toledo Ramos", "Caio Henrique Paiva", "Carolina Dias Viana", "Cecília Moraes Abreu", "Daniel Rezende Sá", "Débora Cunha Macedo",
  "Eduarda Pinheiro Lobo", "Eliane Castro Rangel", "Enzo Gabriel Tomaz", "Fabiana Leite Costa", "Fábio Amaral Duarte", "Flávia Serra Guedes",
  "Gustavo Lacerda Melo", "Heloísa Braga Nunes", "Igor Salgado Freire", "Irene Batista Cruz", "Jéssica Vieira Porto", "Jorge Almeida Coelho",
  "Juliana Farias Bento", "Kátia Monteiro Luz", "Laura Beatriz Sales", "Leonardo Assis Rocha", "Lívia Carneiro Sodré", "Manuela Pires Galvão",
  "Márcio Teles Andrade", "Natália Couto Brito", "Otávio Ribas Mendes", "Paula Fernandes Dutra", "Pedro Henrique Lage", "Rafaela Torres Nobre",
  "Raimundo Sales Filho", "Rita de Cássia Moura", "Rodrigo Esteves Faria", "Sabrina Lopes Aragão", "Samuel Fonseca Cid", "Sílvia Prates Maia",
  "Tatiane Rocha Veloso", "Thiago Bastos Lemos", "Valéria Antunes Góis", "Vinícius Correia Paz", "Viviane Soares Brandão", "Wagner Pimentel Luz",
];

type GuideTemplate = { type: "consulta" | "sadt" | "honorario_individual"; items: Array<[string, number]>; regime: string; carater: string; tipoAtendimento?: string; tipoConsulta?: string };

function templatesFor(specialty: string): GuideTemplate[] {
  const consultaPS: GuideTemplate = { type: "consulta", items: [["10101039", 1]], regime: "02", carater: "2", tipoConsulta: "1" };
  const consultaEletiva: GuideTemplate = { type: "consulta", items: [["10101012", 1]], regime: "01", carater: "1", tipoConsulta: pick(["1", "2"]) };
  const sadt = (items: Array<[string, number]>, regime = "01", carater = "1"): GuideTemplate => ({ type: "sadt", items, regime, carater, tipoAtendimento: "23" });
  const hon = (items: Array<[string, number]>, regime = "03", carater = "1"): GuideTemplate => ({ type: "honorario_individual", items, regime, carater });
  switch (specialty) {
    case "Clínica Médica":
      return [consultaPS, consultaPS, consultaPS, sadt([["40304361", 1], ["40302040", 1], ["40301630", 1]], "02", "2")];
    case "Pediatria":
      return [consultaPS, consultaPS, consultaPS];
    case "Medicina Intensiva":
      return [hon([["10102019", randInt(4, 8)]]), hon([["10102019", randInt(3, 7)]])];
    case "Anestesiologia":
      return [hon([["31602347", 1]]), hon([["31602347", 1]])];
    case "Ginecologia e Obstetrícia":
      return [hon([["31309054", 1]]), hon([["31309127", 1]], "03", "2"), consultaEletiva];
    case "Cardiologia":
      return [consultaEletiva, consultaEletiva, sadt([["40101010", 1], ["40901106", 1]]), sadt([["40101045", 1], ["20102038", 1]])];
    case "Cirurgia Geral":
      return [hon([["31005497", 1]]), sadt([[pick(["40202038", "40202666"]), 1]])];
    case "Radiologia":
      return [sadt([["40901122", 1]]), sadt([["41001010", 1]]), sadt([[pick(["40805026", "40808033"]), 1]])];
    default:
      return [consultaEletiva];
  }
}

function hospitalFor(spec: (typeof D.DEMO_PROFESSIONALS)[number], t: GuideTemplate): string {
  if (t.regime === "02") return spec.hospitals.includes("UPA-JA") && chance(0.5) ? "UPA-JA" : spec.hospitals[0]!;
  if (t.regime === "01" && spec.hospitals.includes("CVP")) return "CVP";
  return spec.hospitals.includes("HSL") ? "HSL" : spec.hospitals[0]!;
}

const DENIAL_REASONS = [
  { code: "1705", text: "Valor apresentado a maior que o contratado", type: "partial" as const, share: 0.15 },
  { code: "1001", text: "Número da carteira do beneficiário inválido", type: "administrative" as const, share: 1 },
  { code: "1806", text: "Quantidade de procedimento acima do permitido em contrato", type: "partial" as const, share: 0.5 },
  { code: "1099", text: "Guia apresentada fora do prazo contratual", type: "administrative" as const, share: 1 },
  { code: "2501", text: "CID ausente ou incompatível com o procedimento", type: "technical" as const, share: 1 },
  { code: "1401", text: "Procedimento sem senha de autorização prévia", type: "total" as const, share: 1 },
];

const COMPETENCES = [
  { month: "2026-07", lastDay: 31, closedAt: "2026-08-05T14:00:00Z", returnAt: "2026-09-01T13:00:00Z", processedAt: "2026-09-03T18:00:00Z" },
  { month: "2026-08", lastDay: 31, closedAt: "2026-09-04T14:00:00Z", returnAt: "2026-09-22T13:00:00Z", processedAt: "2026-09-23T18:00:00Z" },
  { month: "2026-09", lastDay: 24, closedAt: null, returnAt: null, processedAt: null },
];

async function phaseTiss(env: Env): Promise<void> {
  const { admin, tenantId, fin } = env;
  const existing = await must(admin.from("tiss_batches").select("id").eq("tenant_id", tenantId).limit(1), "batches");
  if (existing.length) {
    log("fase tiss: já existem lotes — pulando.");
    return;
  }
  const structure = await loadStructure(env);
  const opWeights: Array<[string, number]> = [["horizonte", 0.45], ["vitalis", 0.35], ["alfa", 0.12], ["beta", 0.08]];
  const pickOperator = () => {
    let r = rnd();
    for (const [k, w] of opWeights) if ((r -= w) <= 0) return k;
    return "horizonte";
  };
  let patientIdx = 0;

  const guidesByComp = new Map<string, Array<{ id: string; op: string; total: number; card: string; items: Array<[string, number]> }>>();

  for (const comp of COMPETENCES) {
    const created: Array<{ id: string; op: string; total: number; card: string; items: Array<[string, number]> }> = [];
    for (const spec of D.DEMO_PROFESSIONALS) {
      const pro = env.professionals.get(spec.handle)!;
      for (const t of templatesFor(spec.specialty)) {
        const op = pickOperator();
        const provider = structure.providers.get(op)!;
        const day = String(randInt(1, comp.lastDay)).padStart(2, "0");
        const date = `${comp.month}-${day}`;
        const ans = { horizonte: "412345", vitalis: "398765", alfa: "999999", beta: "888888" }[op as "alfa"];
        const card = `${ans}.${String(randInt(1, 9999)).padStart(4, "0")}.${String(randInt(1000, 9999))}-${String(randInt(10, 99))}`;
        const guide = await createTissGuide(fin, {
          guide_type: t.type,
          patient_name: PATIENTS[patientIdx++ % PATIENTS.length]!,
          insurance_provider_id: provider.id,
          insurance_contract_id: provider.contractId,
          professional_id: pro.id,
          attendance_date: date,
          beneficiary_card_number: card,
          regime_atendimento: t.regime,
          carater_atendimento: t.carater,
          tipo_atendimento: t.tipoAtendimento ?? null,
          tipo_consulta: t.tipoConsulta ?? null,
        });
        const createdAt = shiftIso(localIso(date, "18:00"), randInt(60, 3 * 24 * 60));
        await maybe(admin.from("tiss_guides").update({ hospital_id: structure.hospitals.get(hospitalFor(spec, t))!, created_at: createdAt < NOW.toISOString() ? createdAt : NOW.toISOString() }).eq("id", guide.id), "guide hospital");
        let total = 0;
        for (const [code, qty] of t.items) {
          const inflated = chance(0.08) ? 1.15 : 1;
          const unit = Math.round(procValue(code) * inflated * 100) / 100;
          await addTissGuideItem(fin, { guide_id: guide.id, procedure_id: structure.procedures.get(code)!, quantity: qty, unit_value: unit, execution_date: date });
          total += unit * qty;
        }
        created.push({ id: guide.id, op, total, card, items: t.items });
      }
    }
    guidesByComp.set(comp.month, created);
    log(`${comp.month}: ${created.length} guias criadas`);

    // Status: jul/ago → aprovadas (algumas negadas na auditoria interna); set → mix.
    for (const g of created) {
      if (comp.month === "2026-09") {
        const r = rnd();
        if (r < 0.35) continue; // rascunho
        await setTissGuideStatus(fin, g.id, "pending_review");
        if (r < 0.62) continue; // aguardando revisão
        await setTissGuideStatus(fin, g.id, chance(0.06) ? "denied" : "approved");
      } else {
        await setTissGuideStatus(fin, g.id, "pending_review");
        await setTissGuideStatus(fin, g.id, comp.month === "2026-08" && chance(0.04) ? "denied" : "approved");
      }
    }

    // Lotes por operadora e tipo de guia — o XSD TISS só aceita lote homogêneo.
    const approved = await must(admin.from("tiss_guides").select("id, insurance_provider_id, guide_type").eq("tenant_id", tenantId).eq("status", "approved").in("id", created.map((g) => g.id)), "approved guides");
    const groups: Array<[string, string, typeof approved]> = [];
    for (const [op, prov] of structure.providers) {
      for (const guideType of ["consulta", "sadt", "honorario_individual"]) {
        const gs = approved.filter((g) => g.insurance_provider_id === prov.id && g.guide_type === guideType);
        if (gs.length) groups.push([op, guideType, gs]);
      }
    }
    for (const [op, guideType, opGuides] of groups) {
      if (comp.month === "2026-09" && !(op === "horizonte" || op === "vitalis")) continue;
      void guideType;
      const batch = await createTissBatch(fin, `${comp.month}-01`);
      for (const g of opGuides) await assignGuideToBatch(fin, { guide_id: g.id, batch_id: batch.id });
      if (comp.month === "2026-09" && op === "horizonte") {
        log(`lote ${batch.batch_number} (${op}/${guideType}) aberto com ${opGuides.length} guias`);
        continue;
      }
      await closeTissBatch(fin, batch.id);
      let exported = false;
      if (comp.month !== "2026-09") {
        try {
          await exportTissBatchXml(fin, batch.id);
          exported = true;
        } catch (err) {
          log(`XML do lote ${batch.batch_number} não exportado:`, (err as Error).message.slice(0, 400));
          await maybe(admin.from("tiss_batches").update({ status: "exported", generated_at: NOW.toISOString() }).eq("id", batch.id), "mark exported");
        }
      }
      if (comp.closedAt) {
        await maybe(admin.from("tiss_batches").update({ created_at: shiftIso(comp.closedAt, -3 * 24 * 60), closed_at: comp.closedAt, generated_at: shiftIso(comp.closedAt, 20 * 60) }).eq("id", batch.id), "batch backdate");
        await maybe(admin.from("tiss_batch_exports").update({ created_at: shiftIso(comp.closedAt, 20 * 60) }).eq("batch_id", batch.id), "export backdate");
      }
      log(`lote ${batch.batch_number} (${op}/${guideType}) ${comp.month === "2026-09" ? "fechado" : exported ? "fechado + XML exportado (XSD ok)" : "fechado"} — ${opGuides.length} guias`);

      // Retornos e glosas.
      if (!comp.returnAt) continue;
      const hasReturn = comp.month === "2026-07" || op === "horizonte" || op === "vitalis";
      if (!hasReturn) continue;
      const ret = await createTissReturn(fin, { batch_id: batch.id, return_reference: `DAC-${op.slice(0, 2).toUpperCase()}-${comp.month.replace("-", "")}-${randInt(100, 999)}` });
      const processedNow = comp.month === "2026-07" || op === "horizonte";
      await updateTissReturnStatus(fin, ret.id, { status: "processing" });
      if (processedNow) await updateTissReturnStatus(fin, ret.id, { status: "processed", processed_at: comp.processedAt });
      await maybe(admin.from("tiss_returns").update({ created_at: comp.returnAt }).eq("id", ret.id), "return backdate");
      if (processedNow) await maybe(admin.from("tiss_batches").update({ status: "processed" }).eq("id", batch.id), "batch processed");

      let denied = opGuides.filter(() => chance(0.2));
      // Garante glosas em aberto (identificada / em análise / em recurso) no retorno mais recente.
      const minimum = comp.month === "2026-08" && op === "horizonte" ? Math.min(3, opGuides.length) : 0;
      if (denied.length < minimum) denied = opGuides.slice(0, minimum);
      for (const g of denied) {
        const info = created.find((c) => c.id === g.id)!;
        const needsAuth = info.items.some(([code]) => ["41001010", "40202038", "40202666", "31309054", "31005497"].includes(code));
        const reason = needsAuth && chance(0.6) ? DENIAL_REASONS[5]! : pick(DENIAL_REASONS.slice(0, 5));
        const value = Math.round(info.total * reason.share * 100) / 100;
        const denial = await createTissDenial(fin, { return_id: ret.id, guide_id: g.id, denial_type: reason.type, denial_reason_code: reason.code, denial_reason_description: reason.text, denied_value: value });
        await maybe(admin.from("tiss_denials").update({ created_at: comp.returnAt }).eq("id", denial.id), "denial backdate");

        if (comp.month === "2026-07") {
          // Julho: glosas já resolvidas — parte aceita, parte revertida em recurso.
          if (reason.type === "administrative" && chance(0.5)) {
            await updateTissDenialStatus(fin, denial.id, { status: "accepted" });
          } else {
            const appeal = await createTissDenialAppeal(fin, { denial_id: denial.id, appeal_reason: appealReason(reason.code) });
            await updateTissDenialAppealStatus(fin, appeal.id, { appeal_status: "under_review" });
            const won = chance(0.65);
            await updateTissDenialAppealStatus(fin, appeal.id, { appeal_status: won ? "accepted" : "rejected" });
            await updateTissDenialStatus(fin, denial.id, { status: won ? "reversed" : "accepted" });
          }
        } else if (op === "horizonte") {
          const r = rnd();
          if (r < 0.3) continue; // identificada
          if (r < 0.5) { await updateTissDenialStatus(fin, denial.id, { status: "under_review" }); continue; }
          const appeal = await createTissDenialAppeal(fin, { denial_id: denial.id, appeal_reason: appealReason(reason.code) });
          if (chance(0.5)) await updateTissDenialAppealStatus(fin, appeal.id, { appeal_status: "under_review" });
        }
      }
      log(`  retorno ${ret.return_reference}: ${denied.length} glosa(s)`);
    }
  }

  // Produção, repasses, fechamento e conciliação.
  for (const comp of COMPETENCES) {
    const cm = `${comp.month}-01`;
    try {
      const { upserted } = await syncMedicalProductionForCompetence(fin, cm);
      log(`${comp.month}: produção médica sincronizada (${upserted})`);
    } catch (err) {
      log(`${comp.month}: produção não sincronizada:`, (err as Error).message);
      continue;
    }
    if (comp.month === "2026-09") continue;
    for (const [handle, pro] of env.professionals) {
      const prod = await must(admin.from("medical_production").select("id").eq("tenant_id", tenantId).eq("professional_id", pro.id).eq("competence_month", cm).limit(1), "production");
      if (!prod.length) continue;
      const payout = await ensureDraftMedicalPayout(fin, pro.id, cm);
      await calculateMedicalPayout(fin, payout.id);
      if (comp.month === "2026-07") {
        await markMedicalPayoutReviewed(fin, payout.id);
        await markMedicalPayoutApproved(env.coord, payout.id);
        await markMedicalPayoutPaid(fin, payout.id);
      } else if (chance(0.5)) {
        await markMedicalPayoutReviewed(fin, payout.id);
      }
      void handle;
    }
    log(`${comp.month}: repasses calculados`);
  }

  const closings: Record<string, string> = {};
  for (const comp of COMPETENCES) {
    const closing = await ensureDraftClosingForCompetence(fin, `${comp.month}-01`);
    await refreshClosingTotalsFromOperationalData(fin, closing.id);
    closings[comp.month] = closing.id;
  }

  // Conciliação: julho com extrato importado; agosto em processamento.
  try {
    const recJul = await ensureDraftReconciliationForCompetence(fin, "2026-07-01");
    await runOperationalMatching(fin, { reconciliationId: recJul.id, mode: "batch" });
    const julBatches = await must(admin.from("tiss_batches").select("id, total_value").eq("tenant_id", tenantId).eq("competence", "2026-07-01"), "jul batches");
    const csv = ["reference_type,reference_id,expected_value,received_value"]
      .concat(julBatches.map((b, i) => `tiss_batch,${b.id},${Number(b.total_value).toFixed(2)},${(Number(b.total_value) * (i === 0 ? 0.93 : 1)).toFixed(2)}`))
      .join("\n");
    await applyCsvImportToReconciliation(fin, { reconciliationId: recJul.id, csvText: csv });
    await linkReconciliationToClosing(fin, { reconciliationId: recJul.id, closingId: closings["2026-07"]! } as never).catch((e: Error) => log("vínculo conciliação/fechamento ignorado:", e.message));
    const recAug = await ensureDraftReconciliationForCompetence(fin, "2026-08-01");
    await runOperationalMatching(fin, { reconciliationId: recAug.id, mode: "batch" });
    log("conciliações de julho e agosto criadas");
  } catch (err) {
    log("conciliação parcial:", (err as Error).message);
  }

  // Fechamento: julho finalizado (trava a competência), agosto em revisão, setembro em rascunho.
  for (const to of ["under_review", "validated", "locked", "finalized"] as const) {
    try {
      await transitionFinancialClosingStatus(env.tenantAdmin, { closingId: closings["2026-07"]!, toStatus: to, note: `Demo — ${to}` });
    } catch (err) {
      log(`fechamento julho → ${to} ignorado:`, (err as Error).message);
      break;
    }
  }
  await transitionFinancialClosingStatus(fin, { closingId: closings["2026-08"]!, toStatus: "under_review", note: "Conferência de glosas em andamento" }).catch((e: Error) => log("fechamento agosto:", e.message));
  log("fechamentos: jul finalizado, ago em revisão, set rascunho");
}

/**
 * Remove os dados de faturamento do tenant demo (tudo o que a fase `tiss`
 * cria) para permitir recriá-los. Só roda com --phase=reset-tiss explícito e
 * sempre filtrado pelo tenant demo. O fechamento é apagado primeiro para
 * liberar a trava de competência finalizada.
 */
async function phaseResetTiss(env: Env): Promise<void> {
  const { admin, tenantId } = env;
  const closings = await must(admin.from("financial_closings").select("id").eq("tenant_id", tenantId), "closings");
  if (closings.length) await maybe(admin.from("financial_closing_snapshots").delete().in("closing_id" as never, closings.map((c) => c.id)), "snapshots");
  const tables = [
    "operational_reconciliation_audit", "operational_reconciliation_issues", "operational_reconciliation_items", "operational_reconciliations",
    "financial_closing_audit", "financial_closings",
    "medical_payout_audit", "medical_payouts", "medical_production",
    "tiss_denial_audit", "tiss_denial_appeals", "tiss_denials", "tiss_denial_financial_rollups", "tiss_denial_reason_rollups",
    "tiss_returns", "tiss_batch_exports", "tiss_guide_items", "tiss_guides", "tiss_batches",
  ] as const;
  for (const t of tables) {
    const { error, count } = await admin.from(t as "tiss_batches").delete({ count: "exact" }).eq("tenant_id", tenantId);
    if (error) throw new Error(`reset ${t}: ${error.message}`);
    log(`reset ${t}: ${count ?? 0}`);
  }
  const entityTypes = ["tiss_guide", "tiss_batch", "tiss_batch_export", "tiss_return", "tiss_denial", "tiss_denial_appeal", "medical_payout", "medical_production", "financial_closing", "operational_reconciliation"];
  const { count } = await admin.from("operational_events").delete({ count: "exact" }).eq("tenant_id", tenantId).in("entity_type", entityTypes as never).gt("created_at", "2026-09-25T00:00:00Z");
  log(`reset eventos de faturamento: ${count ?? 0}`);
}

/** (Re)gera o XML TISS dos lotes já enviados que ainda não têm exportação registrada. */
async function phaseXml(env: Env): Promise<void> {
  const { admin, tenantId, fin } = env;
  const batches = await must(
    admin.from("tiss_batches").select("id, batch_number, status, competence, closed_at").eq("tenant_id", tenantId).in("status", ["exported", "processed"]).order("batch_number"),
    "batches",
  );
  for (const b of batches) {
    const exports = await must(admin.from("tiss_batch_exports").select("id").eq("batch_id", b.id).limit(1), "exports");
    if (exports.length) continue;
    const original = b.status;
    if (original === "processed") await maybe(admin.from("tiss_batches").update({ status: "exported" }).eq("id", b.id), "unprocess");
    try {
      const { xml } = await exportTissBatchXml(fin, b.id);
      const at = b.closed_at ? shiftIso(b.closed_at, 20 * 60) : NOW.toISOString();
      await maybe(admin.from("tiss_batch_exports").update({ created_at: at }).eq("batch_id", b.id), "export backdate");
      await maybe(admin.from("tiss_batches").update({ generated_at: at, status: original }).eq("id", b.id), "restore");
      log(`XML ${b.batch_number}: ${xml.length} bytes, validado contra o XSD TISS 4.01.00`);
    } catch (err) {
      await maybe(admin.from("tiss_batches").update({ status: original }).eq("id", b.id), "restore");
      log(`XML ${b.batch_number} falhou:`, (err as Error).message.slice(0, 500));
    }
  }
}

function appealReason(code: string): string {
  switch (code) {
    case "1705": return "Valor cobrado conforme Anexo I do contrato vigente (cláusula 4.1). Segue tabela assinada.";
    case "1001": return "Carteirinha válida na data do atendimento — anexada cópia do cartão e elegibilidade consultada no portal.";
    case "1806": return "Quantidade justificada pela evolução clínica registrada em prontuário (anexo).";
    case "1099": return "Guia enviada dentro do prazo de 60 dias; protocolo de envio anexado.";
    case "2501": return "CID informado no campo 16 da guia SP/SADT; divergência de leitura pela operadora.";
    case "1401": return "Procedimento realizado em caráter de urgência — autorização posterior obtida (senha anexada).";
    default: return "Recurso com documentação comprobatória anexada.";
  }
}

// ---------------------------------------------------------------------------
// fases: contract / contract-review (esteira RAG real)
// ---------------------------------------------------------------------------

async function phaseContract(env: Env): Promise<void> {
  const op = D.operatorByKey(D.DEMO_CONTRACT.operator);
  const existing = await maybe(env.admin.from("operator_contracts").select("id, status").eq("tenant_id", env.tenantId).eq("contract_label", D.DEMO_CONTRACT.label).maybeSingle(), "operator contract");
  const run = (args: string[]) => {
    const r = spawnSync("npx", ["tsx", ...args], { cwd: root, stdio: "inherit", shell: true });
    if (r.status !== 0) throw new Error(`falhou: ${args.join(" ")}`);
  };
  let contractId = existing?.id;
  if (!existing) {
    run([
      "scripts/rag/cli/index-operator-contract.ts",
      "--pdf", join(__dirname, "assets", D.DEMO_CONTRACT.file),
      "--tenant-id", env.tenantId,
      "--operator-code", op.ans,
      "--operator-name", `"${op.name}"`,
      "--contract-label", D.DEMO_CONTRACT.label,
      "--created-by", env.fin.actorProfileId,
    ]);
    contractId = (await must(env.admin.from("operator_contracts").select("id").eq("tenant_id", env.tenantId).eq("contract_label", D.DEMO_CONTRACT.label).single(), "contract")).id;
  }
  const proposals = await must(env.admin.from("contract_rule_proposals").select("id").eq("operator_contract_id", contractId!).limit(1), "proposals");
  if (!proposals.length) await extractContractProposals(env, contractId!);
}

/**
 * Mesmo fluxo de scripts/rag/cli/extract-contract-rules.ts, mas com a busca
 * RAG feita sob a sessão de um usuário do tenant: `match_knowledge_embeddings`
 * filtra por `current_tenant_ids()`, que é vazio para service_role — a CLI
 * nunca encontra chunks de contratos com tenant_id.
 */
async function extractContractProposals(env: Env, contractId: string): Promise<void> {
  const userClient = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const signIn = await userClient.auth.signInWithPassword({ email: `rafael.souza@${D.DEMO_EMAIL_DOMAIN}`, password: DEMO_PASSWORD });
  if (signIn.error) throw new Error(`login demo: ${signIn.error.message}`);

  const aiProvider = createAIProviderFactory().create({ provider: "openai" });
  let total = 0;
  for (const category of CONTRACT_RULE_CATEGORIES) {
    const queryEmbedding = await embedQuery(aiProvider, CONTRACT_CATEGORY_RETRIEVAL_QUERIES[category]);
    const { data, error } = await userClient.rpc("match_knowledge_embeddings", {
      query_embedding: queryEmbedding as never,
      match_count: 6,
      filter_domain: "contract",
      filter_classification: null as never,
      similarity_threshold: 0,
      filter_document_id: contractId,
    });
    if (error) throw new Error(`busca RAG (${category}): ${error.message}`);
    const chunks = ((data ?? []) as Array<{ id: string; content: string; metadata: { heading?: string | null } }>).map((row) => ({
      id: row.id,
      heading: row.metadata?.heading ?? null,
      content: row.content,
    }));
    const found = await extractContractRulesForCategory(aiProvider, category, chunks);
    log(`contrato [${category}]: ${chunks.length} chunk(s) → ${found.length} proposta(s)`);
    if (!found.length) continue;
    await maybe(
      env.admin.from("contract_rule_proposals").insert(
        found.map((p) => ({
          tenant_id: env.tenantId,
          operator_contract_id: contractId,
          category: p.category,
          description: p.description,
          justification: p.justification,
          citation_heading: p.citationHeading,
          citation_excerpt: p.citationExcerpt,
          source_chunk_ids: p.sourceChunkIds,
          confidence: p.confidence,
          extraction_model: p.extractionModel,
        })),
      ),
      "proposals insert",
    );
    total += found.length;
  }
  await userClient.auth.signOut();
  log(`${total} proposta(s) de regra contratual pendentes de revisão`);
}

async function phaseContractReview(env: Env): Promise<void> {
  const contract = await maybe(env.admin.from("operator_contracts").select("id").eq("tenant_id", env.tenantId).eq("contract_label", D.DEMO_CONTRACT.label).maybeSingle(), "contract");
  if (!contract) return log("contract-review: contrato demo não indexado — rode a fase contract.");
  const all = await listContractRuleProposals(env.tenantAdmin, contract.id as never);
  const pending = (Array.isArray(all) ? all : (all as { proposals: Array<{ id: string; status: string; category: string; description: string; justification: string }> }).proposals)
    .filter((p: { status: string }) => p.status === "pending");
  log(`${pending.length} propostas pendentes`);
  // Deixa 2 pendentes para demonstrar o portão humano; rejeita 1; edita 1; aprova o restante.
  const reviewable = pending.slice(0, Math.max(0, pending.length - 2));
  for (const [i, p] of reviewable.entries()) {
    const common = { proposalId: p.id };
    if (i === 1) {
      await reviewContractRuleProposal(env.tenantAdmin, { ...common, decision: "rejected", reviewNotes: "Regra redundante com a validação padrão de campos obrigatórios TISS." });
    } else if (i === 2) {
      await reviewContractRuleProposal(env.tenantAdmin, {
        ...common,
        decision: "edited",
        editedDescription: `${p.description} (aplicar também a guias de honorário individual)`,
        editedJustification: `${p.justification} Ajuste do revisor: a cláusula 3.1 abrange procedimentos cirúrgicos eletivos faturados em guia de honorário.`,
        reviewNotes: "Escopo ampliado para honorários.",
      });
    } else {
      await reviewContractRuleProposal(env.tenantAdmin, { ...common, decision: "approved", reviewNotes: "Conferido com o contrato assinado." });
    }
  }
  log(`${reviewable.length} propostas revisadas`);
}

// ---------------------------------------------------------------------------
// fase: capture (Captura Inteligente + Centro de Processamento)
// ---------------------------------------------------------------------------

async function phaseCapture(env: Env): Promise<void> {
  const { admin, tenantId, fin } = env;
  const reviewNotes: Record<string, string> = {
    approve: "Guia conferida — dados consistentes com o atendimento.",
    corrections: "Devolvida para correção: verificar campos apontados pela auditoria.",
    reject: "Reprovada: procedimento exige senha de autorização prévia (cláusula 3.1) e a guia não a informa.",
    review: "Em análise pelo faturamento.",
  };
  const statusFor: Record<string, "aprovada" | "aguardando_correcoes" | "reprovada" | "em_revisao"> = {
    approve: "aprovada",
    corrections: "aguardando_correcoes",
    reject: "reprovada",
    review: "em_revisao",
  };

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const guides = limitArg ? D.DEMO_CAPTURE_GUIDES.slice(0, Number(limitArg.slice(8))) : D.DEMO_CAPTURE_GUIDES;
  for (const g of guides) {
    const dup = await must(admin.from("capture_documents").select("session_id").eq("tenant_id", tenantId).eq("original_filename", g.file).is("deleted_at", null).limit(1), "dup");
    if (dup.length) {
      log(`captura ${g.file}: já existe — pulando`);
      continue;
    }
    const bytes = new Uint8Array(readFileSync(join(__dirname, "assets", g.file)));
    const checksum = createHash("sha256").update(bytes).digest("hex");
    const session = await createCaptureSession(fin, { channel: g.type === "consulta" ? "mobile_camera" : "file_upload" });
    await uploadCaptureDocument(fin, { sessionId: session.id, filename: g.file, mimeType: "image/png", byteLength: bytes.byteLength, checksumSha256: checksum, fileBytes: bytes });

    if (g.outcome === "ocr_pending") {
      log(`captura ${g.file}: enviada — aguardando OCR`);
      continue;
    }

    // Enfileira como o upload real faz e processa já (lock antes do cron).
    const job = await enqueueCapturePipelineJob(fin, session.id, "full");
    const locked = await must(
      admin.from("capture_pipeline_jobs").update({ status: "processing", locked_by: "demo-seed", locked_at: new Date().toISOString(), attempts: 1 }).eq("id", job.id).eq("status", "queued").select("*"),
      "lock job",
    );
    const t0 = Date.now();
    if (locked.length) {
      await processCapturePipelineJob(admin, locked[0]!);
    } else {
      log(`captura ${g.file}: job assumido pelo worker de produção — aguardando…`);
      for (let i = 0; i < 60; i++) {
        const j = await must(admin.from("capture_pipeline_jobs").select("status").eq("id", job.id).single(), "job");
        if (j.status === "succeeded" || j.status === "dead_letter") break;
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    const after = await getCaptureSession(fin, session.id);
    const meta = after.metadata as Record<string, any>;
    const jobRow = await must(admin.from("capture_pipeline_jobs").select("status, last_error").eq("id", job.id).single(), "job");
    log(
      `captura ${g.file}: job=${jobRow.status} status=${after.status} ocr=${meta.ocr?.status ?? "-"}(${meta.ocr?.provider ?? meta.ocr?.providerId ?? "?"}) parser=${meta.parser?.status ?? "-"}/${meta.parser?.guideType ?? "-"} audit=${meta.audit?.status ?? "-"} risco=${meta.riskAssessment?.overallRiskLevel ?? "-"} (${Math.round((Date.now() - t0) / 1000)}s)`,
    );
    if (jobRow.last_error) log(`  erro: ${jobRow.last_error}`);

    // Decisão do revisor.
    if (g.outcome === "approve") {
      const store = await getCaptureCorrectionProposalsViaEnterprise(fin, session.id).catch(() => null);
      for (const p of store?.proposals ?? []) {
        if ((p as { status?: string }).status && (p as { status?: string }).status !== "pending") continue;
        const input = { proposalId: p.proposalId, action: "accept" as const };
        const updated = await updateCaptureCorrectionProposalViaEnterprise(fin, session.id, input);
        await recordCaptureLearningDecision(fin, session.id, updated, input).catch(() => undefined);
      }
    }
    if (g.outcome === "corrections") {
      const store = await getCaptureCorrectionProposalsViaEnterprise(fin, session.id).catch(() => null);
      const first = store?.proposals?.[0];
      if (first) {
        const input = { proposalId: first.proposalId, action: "reject" as const };
        const updated = await updateCaptureCorrectionProposalViaEnterprise(fin, session.id, input);
        await recordCaptureLearningDecision(fin, session.id, updated, input).catch(() => undefined);
      }
    }
    try {
      await setReviewApprovalViaEnterprise(fin, { sessionId: session.id, status: statusFor[g.outcome]!, note: reviewNotes[g.outcome] });
    } catch (err) {
      log(`  revisão não aplicada: ${(err as Error).message}`);
    }
    const final = await getCaptureSession(fin, session.id);
    log(`  → fila: ${resolveProcessingQueue(final.status, final.metadata as Record<string, unknown>)} (${final.status})`);
  }
}

// ---------------------------------------------------------------------------

async function main() {
  loadEnv();
  const arg = process.argv.find((a) => a.startsWith("--phase="));
  const phases = arg ? arg.slice(8).split(",") : ["base", "shifts", "tiss", "xml", "contract", "contract-review", "capture"];
  const dryRun = process.argv.includes("--dry-run");
  const env = await buildEnv();
  log(`senha dos usuários demo: ${DEMO_PASSWORD} (domínio @${D.DEMO_EMAIL_DOMAIN})`);

  for (const phase of phases) {
    log(`=== fase ${phase} ===`);
    if (phase === "base") await phaseBase(env);
    else if (phase === "shifts") await phaseShifts(env, dryRun);
    else if (phase === "tiss") await phaseTiss(env);
    else if (phase === "xml") await phaseXml(env);
    else if (phase === "reset-tiss") await phaseResetTiss(env);
    else if (phase === "contract") await phaseContract(env);
    else if (phase === "contract-review") await phaseContractReview(env);
    else if (phase === "capture") await phaseCapture(env);
    else throw new Error(`fase desconhecida: ${phase}`);
  }
  log("concluído.");
}

main().catch((err) => {
  console.error("[demo-seed] FALHOU:", err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
