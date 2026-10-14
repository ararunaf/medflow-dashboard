/**
 * Ponte captura → faturamento: com a guia aprovada na revisão, a pessoa
 * confere o rascunho (convênio pelo ANS, profissional pelo CRM, TUSS pelo
 * código) e cria a guia TISS em rascunho em Faturamento › Guias.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, FilePlus2, Loader2, Plus, Trash2 } from "lucide-react";
import {
  createGuideFromCaptureFn,
  getCaptureBillingStateFn,
} from "@/lib/capture/api/capture-billing-server";
import type { BillingGuideType } from "@/lib/capture/billing/capture-guide-draft";
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import { describeError, unwrap } from "@/lib/queries/result";
import type { CaptureBillingState } from "@/lib/services/tiss/capture-guide-bridge";

const INPUT = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const LABEL = "block text-xs font-medium text-muted-foreground mb-1";

type ItemForm = {
  key: number;
  procedureId: string;
  quantity: string;
  unitValue: string;
  executionDate: string;
  readCode: string | null;
};

type Form = {
  guideType: BillingGuideType | "";
  patientName: string;
  beneficiaryCardNumber: string;
  attendanceDate: string;
  insuranceProviderId: string;
  professionalId: string;
  items: ItemForm[];
};

let itemKey = 0;

function formFromState(state: CaptureBillingState): Form | null {
  const d = state.draft;
  if (!d) return null;
  return {
    guideType: d.guideType ?? "",
    patientName: d.patientName ?? "",
    beneficiaryCardNumber: d.beneficiaryCardNumber ?? "",
    attendanceDate: d.attendanceDate ?? "",
    insuranceProviderId: d.insuranceProviderId ?? "",
    professionalId: d.professionalId ?? "",
    items: d.items.map((item) => ({
      key: ++itemKey,
      procedureId: item.procedureId ?? "",
      quantity: String(item.quantity),
      unitValue: item.unitValue != null ? item.unitValue.toFixed(2) : "",
      executionDate: item.executionDate ?? d.attendanceDate ?? "",
      readCode: item.tussCode,
    })),
  };
}

function missingFields(form: Form): string[] {
  const missing: string[] = [];
  if (!form.guideType) missing.push("tipo de guia");
  if (!form.patientName.trim()) missing.push("paciente");
  if (!form.attendanceDate) missing.push("data do atendimento");
  if (!form.insuranceProviderId) missing.push("convênio");
  if (!form.professionalId) missing.push("profissional");
  if (form.items.length === 0) missing.push("ao menos um procedimento");
  form.items.forEach((item, i) => {
    if (!item.procedureId) missing.push(`procedimento do item ${i + 1}`);
    if (!(Number(item.quantity) >= 1)) missing.push(`quantidade do item ${i + 1}`);
    if (item.unitValue === "" || !(Number(item.unitValue.replace(",", ".")) >= 0)) {
      missing.push(`valor do item ${i + 1}`);
    }
    if (!item.executionDate) missing.push(`data do item ${i + 1}`);
  });
  return missing;
}

export function CaptureBillingPanel({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<CaptureBillingState | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = unwrap<CaptureBillingState>(
        (await getCaptureBillingStateFn({
          data: { sessionId },
        })) as QueryResult<CaptureBillingState>,
      );
      setState(next);
      setForm(formFromState(next));
    } catch (err) {
      setError(describeError(err).message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (p: Partial<Form>) => setForm((f) => (f ? { ...f, ...p } : f));
  const patchItem = (key: number, p: Partial<ItemForm>) =>
    setForm((f) =>
      f ? { ...f, items: f.items.map((it) => (it.key === key ? { ...it, ...p } : it)) } : f,
    );

  async function submit() {
    if (!form || !form.guideType) return;
    setSaving(true);
    setError(null);
    try {
      unwrap(
        (await createGuideFromCaptureFn({
          data: {
            sessionId,
            guideType: form.guideType,
            patientName: form.patientName.trim(),
            beneficiaryCardNumber: form.beneficiaryCardNumber.trim(),
            attendanceDate: form.attendanceDate,
            insuranceProviderId: form.insuranceProviderId,
            professionalId: form.professionalId,
            items: form.items.map((it) => ({
              procedureId: it.procedureId,
              quantity: Number(it.quantity),
              unitValue: Number(it.unitValue.replace(",", ".")),
              executionDate: it.executionDate,
            })),
          },
        })) as MutationResult<unknown>,
      );
      await load();
    } catch (err) {
      setError(describeError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-label="Enviar para o faturamento"
      className="mt-6 rounded-xl border border-primary/25 bg-primary/[0.03] p-4 space-y-4"
    >
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <FilePlus2 className="h-4 w-4 text-primary" /> Enviar para o faturamento
      </h3>

      {loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Montando o rascunho da guia…
        </p>
      ) : null}

      {!loading && state?.existingGuide ? (
        <p className="text-sm">
          Esta captura já virou a guia nº <b>{state.existingGuide.guideNumber}</b> (
          {state.existingGuide.status === "draft" ? "rascunho" : state.existingGuide.status}).{" "}
          <Link
            to="/tiss"
            search={{ tab: "guias" }}
            className="font-medium text-primary hover:underline"
          >
            Abrir em Faturamento › Guias
          </Link>
        </p>
      ) : null}

      {!loading && state && !state.approved && !state.existingGuide ? (
        <p className="text-sm text-muted-foreground">
          Aprove a guia acima para enviá-la ao faturamento.
        </p>
      ) : null}

      {!loading && state && form ? (
        <>
          <p className="text-xs text-muted-foreground">
            Rascunho montado a partir da guia lida e das correções aceitas. Confira antes de criar —
            a guia nasce como rascunho e segue o fluxo normal de revisão, lote e XML.
          </p>

          {state.draft && state.draft.warnings.length > 0 ? (
            <ul className="rounded-lg border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2 text-xs space-y-1">
              {state.draft.warnings.map((w) => (
                <li key={w} className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                  {w}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="cb-type">
                Tipo de guia
              </label>
              <select
                id="cb-type"
                className={INPUT}
                value={form.guideType}
                onChange={(e) => patch({ guideType: e.target.value as Form["guideType"] })}
              >
                <option value="">Selecione…</option>
                <option value="consulta">Consulta</option>
                <option value="sadt">SP/SADT</option>
                <option value="honorario_individual">Honorário individual</option>
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="cb-date">
                Data do atendimento
              </label>
              <input
                id="cb-date"
                type="date"
                className={INPUT}
                value={form.attendanceDate}
                onChange={(e) => patch({ attendanceDate: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="cb-patient">
                Paciente
              </label>
              <input
                id="cb-patient"
                className={INPUT}
                maxLength={200}
                value={form.patientName}
                onChange={(e) => patch({ patientName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="cb-card">
                Número da carteira
              </label>
              <input
                id="cb-card"
                className={INPUT}
                maxLength={40}
                value={form.beneficiaryCardNumber}
                onChange={(e) => patch({ beneficiaryCardNumber: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="cb-provider">
                Convênio{" "}
                {state.draft?.operatorAnsCode ? `(ANS lido: ${state.draft.operatorAnsCode})` : ""}
              </label>
              <select
                id="cb-provider"
                className={INPUT}
                value={form.insuranceProviderId}
                onChange={(e) => patch({ insuranceProviderId: e.target.value })}
              >
                <option value="">Selecione…</option>
                {state.providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="cb-prof">
                Profissional{" "}
                {state.draft?.executingCrm ? `(CRM lido: ${state.draft.executingCrm})` : ""}
              </label>
              <select
                id="cb-prof"
                className={INPUT}
                value={form.professionalId}
                onChange={(e) => patch({ professionalId: e.target.value })}
              >
                <option value="">Selecione…</option>
                {state.professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Procedimentos
            </div>
            {form.items.map((item, i) => (
              <div
                key={item.key}
                className="grid gap-2 rounded-lg border border-border bg-card p-2 sm:grid-cols-[minmax(0,2fr)_70px_110px_150px_auto] items-end"
              >
                <div>
                  <label className={LABEL} htmlFor={`cb-proc-${item.key}`}>
                    Item {i + 1}
                    {item.readCode ? ` — TUSS lido ${item.readCode}` : ""}
                  </label>
                  <select
                    id={`cb-proc-${item.key}`}
                    className={INPUT}
                    value={item.procedureId}
                    onChange={(e) => {
                      const proc = state.procedures.find((p) => p.id === e.target.value);
                      patchItem(item.key, {
                        procedureId: e.target.value,
                        unitValue:
                          item.unitValue === "" && proc
                            ? proc.defaultValue.toFixed(2)
                            : item.unitValue,
                      });
                    }}
                  >
                    <option value="">Selecione o procedimento…</option>
                    {state.procedures.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL} htmlFor={`cb-qty-${item.key}`}>
                    Qtd.
                  </label>
                  <input
                    id={`cb-qty-${item.key}`}
                    type="number"
                    min={1}
                    className={INPUT}
                    value={item.quantity}
                    onChange={(e) => patchItem(item.key, { quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`cb-val-${item.key}`}>
                    Valor (R$)
                  </label>
                  <input
                    id={`cb-val-${item.key}`}
                    inputMode="decimal"
                    className={INPUT}
                    value={item.unitValue}
                    onChange={(e) => patchItem(item.key, { unitValue: e.target.value })}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`cb-exec-${item.key}`}>
                    Execução
                  </label>
                  <input
                    id={`cb-exec-${item.key}`}
                    type="date"
                    className={INPUT}
                    value={item.executionDate}
                    onChange={(e) => patchItem(item.key, { executionDate: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remover item ${i + 1}`}
                  onClick={() =>
                    setForm((f) =>
                      f ? { ...f, items: f.items.filter((x) => x.key !== item.key) } : f,
                    )
                  }
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setForm((f) =>
                  f
                    ? {
                        ...f,
                        items: [
                          ...f.items,
                          {
                            key: ++itemKey,
                            procedureId: "",
                            quantity: "1",
                            unitValue: "",
                            executionDate: f.attendanceDate,
                            readCode: null,
                          },
                        ],
                      }
                    : f,
                )
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar procedimento
            </button>
          </div>

          {(() => {
            const missing = missingFields(form);
            return (
              <div className="space-y-2">
                {missing.length > 0 ? (
                  <p className="text-xs text-muted-foreground">Falta: {missing.join(", ")}.</p>
                ) : null}
                <button
                  type="button"
                  disabled={saving || missing.length > 0}
                  onClick={() => void submit()}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FilePlus2 className="h-4 w-4" />
                  )}
                  {saving ? "Criando guia…" : "Criar guia de faturamento"}
                </button>
              </div>
            );
          })()}
        </>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
