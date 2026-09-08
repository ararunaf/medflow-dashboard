/**
 * SEC-PII-01 (+ 01A/01B/01C) — RLS de least privilege, ownership imutável e
 * integridade relacional cross-owner em todo o domínio Capture (sessões
 * reais, Supabase real): capture_sessions, capture_documents, capture_pages,
 * capture_fields, capture_findings, capture_corrections.
 *
 * Achado original (auditoria externa): essas tabelas liberavam SELECT para
 * QUALQUER membro autenticado do tenant — capture_sessions.metadata carrega
 * dado sensível (ver ocr-service.ts/semantic-fallback-service.ts), e
 * capture_documents.original_filename grava o nome do arquivo exatamente
 * como o usuário enviou (PII plausível). Mesma classe de risco já corrigida
 * para medical_payouts em F5-S3 (medical-payout-rls-e2e.test.ts) — este
 * teste segue o mesmo padrão: prova com sessões reais (anon key +
 * signInWithPassword, não service_role), não asserção estática sobre o SQL.
 *
 * SEC-PII-01B (auditoria read-only) confirmou dois gaps adicionais, ambos
 * fechados por esta migration e cobertos aqui:
 *   - capture_documents/capture_pages tinham ficado fora do hardening;
 *   - nada impedia um owner de reassociar session_id/page_id/document_id de
 *     uma linha própria para um pai pertencente a OUTRO owner do tenant.
 *
 * Cria um tenant dedicado (prefixo "e2e-secpii01-") + um segundo tenant só
 * para a prova de isolamento cross-tenant, e limpa tudo ao final.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";

const hasSupabase =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const FAKE_CHECKSUM_A = "a".repeat(64);
const FAKE_CHECKSUM_B = "b".repeat(64);

describe("SEC-PII-01/01A/01B/01C — RLS + ownership + integridade relacional em capture_* (sessões reais, Supabase real)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let admin: SupabaseClient<Database>;
  let tenantId: string;
  let otherTenantId: string;
  let profileAId: string;
  let profileBId: string;
  const authUserIds: string[] = [];
  let clientA: SupabaseClient<Database>; // financial — criador da sessão/objetos principais
  let clientB: SupabaseClient<Database>; // financial — NÃO criador, não é manager
  let clientCoord: SupabaseClient<Database>; // coordinator — is_operational_manager()

  // Objetos de A (sessão principal usada na maioria dos casos)
  let sessionId: string;
  let documentId: string;
  let pageId: string;
  let fieldId: string;
  let findingId: string;
  let correctionId: string;

  // Segunda sessão de A — usada para provar reassociação legítima (self→self)
  let sessionId2: string;

  // Objetos de B — usados para provar visibilidade negada e reassociação cross-owner negada
  let sessionIdB: string;
  let documentIdB: string;
  let pageIdB: string;

  let otherTenantSessionId: string;

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    admin = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await admin
      .from("tenants")
      .insert({ name: `E2E SEC-PII-01 ${suffix}`, slug: `e2e-secpii01-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    const otherTenant = await admin
      .from("tenants")
      .insert({ name: `E2E SEC-PII-01 other ${suffix}`, slug: `e2e-secpii01-other-${suffix}` })
      .select("id")
      .single();
    if (otherTenant.error) throw new Error(`setup other tenant: ${otherTenant.error.message}`);
    otherTenantId = otherTenant.data.id;

    async function makeUser(label: string, role: "financial" | "coordinator", ofTenantId: string) {
      const email = `e2e-secpii01-${label}-${suffix}@example.invalid`;
      const password = `Test-${suffix}-${label}-!Aa1`;
      const authUser = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (authUser.error || !authUser.data.user) throw new Error(`setup auth user ${label}: ${authUser.error?.message}`);
      authUserIds.push(authUser.data.user.id);

      const profile = await admin
        .from("profiles")
        .insert({ id: authUser.data.user.id, tenant_id: ofTenantId, full_name: `E2E SEC-PII-01 ${label}`, role })
        .select("id")
        .single();
      if (profile.error) throw new Error(`setup profile ${label}: ${profile.error.message}`);

      const { createClient: createAnonClient } = await import("@supabase/supabase-js");
      const client = createAnonClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false },
      });
      const signIn = await client.auth.signInWithPassword({ email, password });
      if (signIn.error) throw new Error(`sign in ${label}: ${signIn.error.message}`);

      return { profileId: profile.data.id, client };
    }

    const a = await makeUser("a", "financial", tenantId);
    profileAId = a.profileId;
    clientA = a.client;

    const b = await makeUser("b", "financial", tenantId);
    profileBId = b.profileId;
    clientB = b.client;

    const coord = await makeUser("coord", "coordinator", tenantId);
    clientCoord = coord.client;

    async function insertSession(ownerId: string, ofTenantId: string) {
      const r = await admin
        .from("capture_sessions")
        .insert({ tenant_id: ofTenantId, created_by: ownerId, status: "OCR_PENDING" })
        .select("id")
        .single();
      if (r.error) throw new Error(`setup session: ${r.error.message}`);
      return r.data.id as string;
    }

    async function insertDocument(ownerId: string, ofTenantId: string, ofSessionId: string, checksum: string) {
      const r = await admin
        .from("capture_documents")
        .insert({
          tenant_id: ofTenantId,
          session_id: ofSessionId,
          created_by: ownerId,
          original_filename: "guia.pdf",
          mime_type: "application/pdf",
          byte_length: 1024,
          checksum_sha256: checksum,
          storage_path_original: `${ofTenantId}/${ofSessionId}/original/guia.pdf`,
        })
        .select("id")
        .single();
      if (r.error) throw new Error(`setup document: ${r.error.message}`);
      return r.data.id as string;
    }

    async function insertPage(ownerId: string, ofTenantId: string, ofSessionId: string, ofDocumentId: string) {
      const r = await admin
        .from("capture_pages")
        .insert({ tenant_id: ofTenantId, session_id: ofSessionId, document_id: ofDocumentId, page_number: 1, created_by: ownerId })
        .select("id")
        .single();
      if (r.error) throw new Error(`setup page: ${r.error.message}`);
      return r.data.id as string;
    }

    // --- Objetos de A ---
    sessionId = await insertSession(profileAId, tenantId);
    documentId = await insertDocument(profileAId, tenantId, sessionId, FAKE_CHECKSUM_A);
    pageId = await insertPage(profileAId, tenantId, sessionId, documentId);
    sessionId2 = await insertSession(profileAId, tenantId); // segunda sessão de A, p/ reassociação self→self

    const field = await admin
      .from("capture_fields")
      .insert({
        tenant_id: tenantId,
        session_id: sessionId,
        page_id: pageId,
        created_by: profileAId,
        field_key: "beneficiary_cpf",
        field_value: "123.456.789-00",
      })
      .select("id")
      .single();
    if (field.error) throw new Error(`setup field: ${field.error.message}`);
    fieldId = field.data.id;

    const finding = await admin
      .from("capture_findings")
      .insert({ tenant_id: tenantId, session_id: sessionId, created_by: profileAId, rule_code: "TEST_RULE", message: "achado de teste" })
      .select("id")
      .single();
    if (finding.error) throw new Error(`setup finding: ${finding.error.message}`);
    findingId = finding.data.id;

    const correction = await admin
      .from("capture_corrections")
      .insert({ tenant_id: tenantId, session_id: sessionId, created_by: profileAId, corrected_value: "valor corrigido" })
      .select("id")
      .single();
    if (correction.error) throw new Error(`setup correction: ${correction.error.message}`);
    correctionId = correction.data.id;

    // --- Objetos de B (mesmo tenant, dono diferente) ---
    sessionIdB = await insertSession(profileBId, tenantId);
    documentIdB = await insertDocument(profileBId, tenantId, sessionIdB, FAKE_CHECKSUM_B);
    pageIdB = await insertPage(profileBId, tenantId, sessionIdB, documentIdB);

    // --- Outro tenant ---
    otherTenantSessionId = await insertSession(profileAId, otherTenantId);
  });

  after(async () => {
    if (!admin) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["capture_corrections", () => admin.from("capture_corrections").delete().in("tenant_id", [tenantId, otherTenantId])],
      ["capture_findings", () => admin.from("capture_findings").delete().in("tenant_id", [tenantId, otherTenantId])],
      ["capture_fields", () => admin.from("capture_fields").delete().in("tenant_id", [tenantId, otherTenantId])],
      ["capture_pages", () => admin.from("capture_pages").delete().in("tenant_id", [tenantId, otherTenantId])],
      ["capture_documents", () => admin.from("capture_documents").delete().in("tenant_id", [tenantId, otherTenantId])],
      ["capture_sessions", () => admin.from("capture_sessions").delete().in("tenant_id", [tenantId, otherTenantId])],
    ];
    for (const [label, run] of steps) {
      const { error } = await run();
      if (error) console.warn(`[E2E cleanup] ${label}: ${error.message}`);
    }
    for (const id of authUserIds) {
      const del = await admin.auth.admin.deleteUser(id);
      if (del.error) console.warn(`[E2E cleanup] auth user ${id}: ${del.error.message}`);
    }
    if (tenantId) {
      const { error } = await admin.from("tenants").delete().eq("id", tenantId);
      if (error) console.warn(`[E2E cleanup] tenant: ${error.message}`);
    }
    if (otherTenantId) {
      const { error } = await admin.from("tenants").delete().eq("id", otherTenantId);
      if (error) console.warn(`[E2E cleanup] other tenant: ${error.message}`);
    }
  });

  // -------------------------------------------------------------------
  // SELECT — capture_sessions/fields/findings/corrections
  // -------------------------------------------------------------------

  it("criador (self) enxerga a própria capture_session via SELECT direto", async () => {
    const row = await clientA.from("capture_sessions").select("id").eq("id", sessionId).maybeSingle();
    assert.equal(row.error, null, row.error?.message);
    assert.ok(row.data, "criador deve enxergar a própria sessão");
  });

  it("usuário do mesmo tenant SEM autorização (não criador, não manager) NÃO lê a sessão nem seus dados", async () => {
    const session = await clientB.from("capture_sessions").select("id").eq("id", sessionId).maybeSingle();
    assert.equal(session.error, null, session.error?.message);
    assert.equal(session.data, null, "RLS deve filtrar a sessão de outro usuário — não pode aparecer");

    const field = await clientB.from("capture_fields").select("id, field_value").eq("id", fieldId).maybeSingle();
    assert.equal(field.data, null, "capture_fields deve ficar invisível para não autorizado");

    const finding = await clientB.from("capture_findings").select("id").eq("id", findingId).maybeSingle();
    assert.equal(finding.data, null, "capture_findings deve ficar invisível para não autorizado");

    const correction = await clientB.from("capture_corrections").select("id").eq("id", correctionId).maybeSingle();
    assert.equal(correction.data, null, "capture_corrections deve ficar invisível para não autorizado");
  });

  it("usuário autorizado (coordinator/is_operational_manager) lê a sessão e os dados associados", async () => {
    const session = await clientCoord.from("capture_sessions").select("id").eq("id", sessionId).maybeSingle();
    assert.equal(session.error, null, session.error?.message);
    assert.ok(session.data, "coordinator deve enxergar sessões de qualquer criador no tenant");

    const field = await clientCoord.from("capture_fields").select("id, field_value").eq("id", fieldId).maybeSingle();
    assert.ok(field.data, "coordinator deve enxergar capture_fields de qualquer criador");
    assert.equal(field.data!.field_value, "123.456.789-00");
  });

  it("listagem sem filtro por id também respeita self-or-manager (nunca vaza linha de outro criador)", async () => {
    const listB = await clientB.from("capture_sessions").select("id").eq("tenant_id", tenantId);
    assert.equal(listB.error, null, listB.error?.message);
    assert.ok(!(listB.data ?? []).some((r) => r.id === sessionId), "sessão de A nunca deve aparecer para B na listagem");

    const listCoord = await clientCoord.from("capture_sessions").select("id").eq("tenant_id", tenantId);
    assert.ok((listCoord.data ?? []).some((r) => r.id === sessionId), "coordinator deve ver a sessão de A na listagem");
  });

  it("cross-tenant continua bloqueado — mesmo coordinator não vê sessão de outro tenant", async () => {
    const row = await clientCoord.from("capture_sessions").select("id").eq("id", otherTenantSessionId).maybeSingle();
    assert.equal(row.error, null, row.error?.message);
    assert.equal(row.data, null, "sessão de outro tenant nunca pode aparecer, nem para manager");
  });

  // -------------------------------------------------------------------
  // SEC-PII-01C — capture_documents/capture_pages (fora do hardening
  // original, corrigidas nesta migration)
  // -------------------------------------------------------------------

  it("documents/pages: criador (self) enxerga os próprios", async () => {
    const doc = await clientA.from("capture_documents").select("id, original_filename").eq("id", documentId).maybeSingle();
    assert.equal(doc.error, null, doc.error?.message);
    assert.ok(doc.data, "criador deve enxergar o próprio documento");

    const page = await clientA.from("capture_pages").select("id").eq("id", pageId).maybeSingle();
    assert.ok(page.data, "criador deve enxergar a própria página");
  });

  it("documents/pages: financial-only NÃO lê nem altera documento/página de outro owner do mesmo tenant", async () => {
    const doc = await clientA.from("capture_documents").select("id").eq("id", documentIdB).maybeSingle();
    assert.equal(doc.data, null, "documento de B não pode ser visível para A (financial-only, não-manager)");

    const page = await clientA.from("capture_pages").select("id").eq("id", pageIdB).maybeSingle();
    assert.equal(page.data, null, "página de B não pode ser visível para A (financial-only, não-manager)");

    const updateAttempt = await clientA
      .from("capture_documents")
      .update({ original_filename: "hijacked.pdf" })
      .eq("id", documentIdB)
      .select("id")
      .maybeSingle();
    assert.equal(updateAttempt.data, null, "UPDATE de A no documento de B não deve afetar nem retornar a linha");

    const verify = await admin.from("capture_documents").select("original_filename").eq("id", documentIdB).single();
    assert.notEqual(verify.data?.original_filename, "hijacked.pdf");
  });

  it("documents/pages: manager legítimo acessa documento/página de qualquer criador no tenant", async () => {
    const doc = await clientCoord.from("capture_documents").select("id").eq("id", documentIdB).maybeSingle();
    assert.ok(doc.data, "coordinator deve enxergar documento de qualquer criador");

    const page = await clientCoord.from("capture_pages").select("id").eq("id", pageIdB).maybeSingle();
    assert.ok(page.data, "coordinator deve enxergar página de qualquer criador");
  });

  it("documents/pages: cross-tenant continua bloqueado", async () => {
    const otherDoc = await admin
      .from("capture_documents")
      .insert({
        tenant_id: otherTenantId,
        session_id: otherTenantSessionId,
        created_by: profileAId,
        original_filename: "outro-tenant.pdf",
        mime_type: "application/pdf",
        byte_length: 10,
        checksum_sha256: "c".repeat(64),
        storage_path_original: `${otherTenantId}/${otherTenantSessionId}/original/x.pdf`,
      })
      .select("id")
      .single();
    if (otherDoc.error) throw new Error(otherDoc.error.message);

    const row = await clientCoord.from("capture_documents").select("id").eq("id", otherDoc.data.id).maybeSingle();
    assert.equal(row.data, null, "documento de outro tenant nunca pode aparecer, nem para manager do tenant principal");
  });

  // -------------------------------------------------------------------
  // INSERT — sem alteração em nenhuma rodada, verificado por completude
  // -------------------------------------------------------------------

  it("INSERT não permite escalar tenant_id para outro tenant (WITH CHECK pré-existente)", async () => {
    const attempt = await clientA
      .from("capture_sessions")
      .insert({ tenant_id: otherTenantId, created_by: profileAId, status: "OCR_PENDING" })
      .select("id")
      .maybeSingle();
    assert.ok(attempt.error, "insert com tenant_id de outro tenant deve ser rejeitado pela RLS");
    assert.equal(attempt.data, null);
  });

  it("INSERT não permite se passar por outro criador (created_by != auth.uid())", async () => {
    const attempt = await clientA
      .from("capture_sessions")
      .insert({ tenant_id: tenantId, created_by: profileBId, status: "OCR_PENDING" })
      .select("id")
      .maybeSingle();
    assert.ok(attempt.error, "insert com created_by de outro usuário deve ser rejeitado pela RLS");
    assert.equal(attempt.data, null);
  });

  // -------------------------------------------------------------------
  // UPDATE self-or-manager — capture_sessions (achado original confirmado
  // em staging: financial não-owner conseguia UPDATE+RETURNING)
  // -------------------------------------------------------------------

  it("owner UPDATE permitido — criador altera a própria sessão", async () => {
    const update = await clientA
      .from("capture_sessions")
      .update({ correlation_id: "e2e-secpii01-owner-update" })
      .eq("id", sessionId)
      .select("id, correlation_id")
      .maybeSingle();
    assert.equal(update.error, null, update.error?.message);
    assert.equal(update.data?.correlation_id, "e2e-secpii01-owner-update");
  });

  it("same-tenant non-owner UPDATE negado (financial-only, sem ser manager, sem ser criador)", async () => {
    const update = await clientB
      .from("capture_sessions")
      .update({ correlation_id: "e2e-secpii01-should-not-apply" })
      .eq("id", sessionId)
      .select("id, correlation_id")
      .maybeSingle();
    assert.equal(update.data, null, "UPDATE de não-owner/não-manager não deve afetar nem retornar a linha");

    const verify = await admin.from("capture_sessions").select("correlation_id").eq("id", sessionId).single();
    assert.notEqual(
      verify.data?.correlation_id,
      "e2e-secpii01-should-not-apply",
      "a tentativa de B não pode ter alterado o valor real da linha",
    );
  });

  it("manager UPDATE permitido — coordinator altera sessão de outro criador", async () => {
    const update = await clientCoord
      .from("capture_sessions")
      .update({ correlation_id: "e2e-secpii01-manager-update" })
      .eq("id", sessionId)
      .select("id, correlation_id")
      .maybeSingle();
    assert.equal(update.error, null, update.error?.message);
    assert.equal(update.data?.correlation_id, "e2e-secpii01-manager-update");
  });

  it("cross-tenant UPDATE negado — mesmo manager não altera sessão de outro tenant", async () => {
    const update = await clientCoord
      .from("capture_sessions")
      .update({ correlation_id: "e2e-secpii01-cross-tenant-should-fail" })
      .eq("id", otherTenantSessionId)
      .select("id")
      .maybeSingle();
    assert.equal(update.data, null, "UPDATE cross-tenant não deve afetar nem retornar a linha");
  });

  // -------------------------------------------------------------------
  // Ownership imutável — tenant_id/created_by (capture_sessions + extensão
  // SEC-PII-01C para capture_documents)
  // -------------------------------------------------------------------

  it("tentativa de alterar tenant_id é negada mesmo pelo próprio criador (capture_sessions)", async () => {
    const attempt = await clientA
      .from("capture_sessions")
      .update({ tenant_id: otherTenantId })
      .eq("id", sessionId)
      .select("id")
      .maybeSingle();
    assert.ok(attempt.error, "trigger de imutabilidade deve rejeitar troca de tenant_id");
    assert.match(attempt.error?.message ?? "", /imut[aá]vel/i);

    const verify = await admin.from("capture_sessions").select("tenant_id").eq("id", sessionId).single();
    assert.equal(verify.data?.tenant_id, tenantId, "tenant_id real não pode ter mudado");
  });

  it("tentativa de alterar created_by é negada mesmo por um manager (capture_sessions)", async () => {
    const attempt = await clientCoord
      .from("capture_sessions")
      .update({ created_by: profileBId })
      .eq("id", sessionId)
      .select("id")
      .maybeSingle();
    assert.ok(attempt.error, "trigger de imutabilidade deve rejeitar troca de created_by");
    assert.match(attempt.error?.message ?? "", /imut[aá]vel/i);

    const verify = await admin.from("capture_sessions").select("created_by").eq("id", sessionId).single();
    assert.equal(verify.data?.created_by, profileAId, "created_by real não pode ter mudado");
  });

  it("tentativa de alterar tenant_id/created_by também é negada em capture_documents (extensão SEC-PII-01C)", async () => {
    const tenantAttempt = await clientA
      .from("capture_documents")
      .update({ tenant_id: otherTenantId })
      .eq("id", documentId)
      .select("id")
      .maybeSingle();
    assert.ok(tenantAttempt.error, "trigger de imutabilidade deve rejeitar troca de tenant_id em capture_documents");

    const ownerAttempt = await clientCoord
      .from("capture_documents")
      .update({ created_by: profileBId })
      .eq("id", documentId)
      .select("id")
      .maybeSingle();
    assert.ok(ownerAttempt.error, "trigger de imutabilidade deve rejeitar troca de created_by em capture_documents");

    const verify = await admin.from("capture_documents").select("tenant_id, created_by").eq("id", documentId).single();
    assert.equal(verify.data?.tenant_id, tenantId);
    assert.equal(verify.data?.created_by, profileAId);
  });

  // -------------------------------------------------------------------
  // SEC-PII-01C — integridade relacional cross-owner: owner não pode
  // reassociar field/finding/document/page para pai de outro owner
  // -------------------------------------------------------------------

  it("owner NÃO consegue reassociar capture_fields.session_id para sessão de outro owner", async () => {
    const attempt = await clientA
      .from("capture_fields")
      .update({ session_id: sessionIdB })
      .eq("id", fieldId)
      .select("id")
      .maybeSingle();
    assert.ok(attempt.error, "relationship guard deve rejeitar reassociação para sessão de outro owner");
    assert.match(attempt.error?.message ?? "", /reassociado|própri[oa] usuário/i);

    const verify = await admin.from("capture_fields").select("session_id").eq("id", fieldId).single();
    assert.equal(verify.data?.session_id, sessionId, "session_id real não pode ter mudado");
  });

  it("owner NÃO consegue reassociar capture_fields.page_id para página de outro owner", async () => {
    const attempt = await clientA
      .from("capture_fields")
      .update({ page_id: pageIdB })
      .eq("id", fieldId)
      .select("id")
      .maybeSingle();
    assert.ok(attempt.error, "relationship guard deve rejeitar reassociação para página de outro owner");

    const verify = await admin.from("capture_fields").select("page_id").eq("id", fieldId).single();
    assert.equal(verify.data?.page_id, pageId, "page_id real não pode ter mudado");
  });

  it("owner NÃO consegue reassociar capture_findings.session_id para sessão de outro owner", async () => {
    const attempt = await clientA
      .from("capture_findings")
      .update({ session_id: sessionIdB })
      .eq("id", findingId)
      .select("id")
      .maybeSingle();
    assert.ok(attempt.error, "relationship guard deve rejeitar reassociação de finding para sessão de outro owner");

    const verify = await admin.from("capture_findings").select("session_id").eq("id", findingId).single();
    assert.equal(verify.data?.session_id, sessionId);
  });

  it("owner NÃO consegue reassociar capture_documents.session_id para sessão de outro owner", async () => {
    const attempt = await clientA
      .from("capture_documents")
      .update({ session_id: sessionIdB })
      .eq("id", documentId)
      .select("id")
      .maybeSingle();
    assert.ok(attempt.error, "relationship guard deve rejeitar reassociação de document para sessão de outro owner");

    const verify = await admin.from("capture_documents").select("session_id").eq("id", documentId).single();
    assert.equal(verify.data?.session_id, sessionId);
  });

  it("owner NÃO consegue reassociar capture_pages.document_id para documento de outro owner", async () => {
    const attempt = await clientA
      .from("capture_pages")
      .update({ document_id: documentIdB })
      .eq("id", pageId)
      .select("id")
      .maybeSingle();
    assert.ok(attempt.error, "relationship guard deve rejeitar reassociação de page para documento de outro owner");

    const verify = await admin.from("capture_pages").select("document_id").eq("id", pageId).single();
    assert.equal(verify.data?.document_id, documentId);
  });

  it("relacionamento legítimo do próprio owner continua funcionando (self→self)", async () => {
    const attempt = await clientA
      .from("capture_findings")
      .update({ session_id: sessionId2 })
      .eq("id", findingId)
      .select("id, session_id")
      .maybeSingle();
    assert.equal(attempt.error, null, attempt.error?.message);
    assert.equal(attempt.data?.session_id, sessionId2, "owner deve poder reassociar para outra sessão que ele mesmo possui");

    // devolve ao estado original para não afetar outros testes/cleanup
    await admin.from("capture_findings").update({ session_id: sessionId }).eq("id", findingId);
  });

  it("manager pode reassociar relacionamento para pai de qualquer owner do tenant", async () => {
    const attempt = await clientCoord
      .from("capture_findings")
      .update({ session_id: sessionIdB })
      .eq("id", findingId)
      .select("id, session_id")
      .maybeSingle();
    assert.equal(attempt.error, null, attempt.error?.message);
    assert.equal(attempt.data?.session_id, sessionIdB, "manager deve poder reassociar para sessão de qualquer owner");

    // devolve ao estado original
    await admin.from("capture_findings").update({ session_id: sessionId }).eq("id", findingId);
  });

  // -------------------------------------------------------------------
  // Backend / service_role
  // -------------------------------------------------------------------

  it("backend/service_role preservado — admin continua lendo/gravando qualquer linha, RLS não se aplica", async () => {
    const read = await admin.from("capture_sessions").select("id, created_by").eq("id", sessionId).single();
    assert.equal(read.error, null, read.error?.message);
    assert.equal(read.data?.created_by, profileAId);

    const write = await admin
      .from("capture_sessions")
      .update({ correlation_id: "e2e-secpii01-service-role-update" })
      .eq("id", sessionId)
      .select("correlation_id")
      .single();
    assert.equal(write.error, null, write.error?.message);
    assert.equal(write.data?.correlation_id, "e2e-secpii01-service-role-update");

    const docRead = await admin.from("capture_documents").select("id").eq("id", documentId).single();
    assert.equal(docRead.error, null, docRead.error?.message);
  });
});
