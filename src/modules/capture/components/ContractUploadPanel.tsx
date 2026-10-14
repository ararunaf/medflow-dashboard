import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileUp, Loader2 } from "lucide-react";
import { formatFileSize } from "../utils/file-format";
import {
  CONTRACT_CATEGORY_LABELS,
  ingestOperatorContract,
  type ContractIngestionStep,
} from "../services/contract-ingestion-client";

const INPUT = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const LABEL = "block text-xs font-medium text-muted-foreground mb-1";
const MAX_BYTES = 25 * 1024 * 1024;

function stepText(step: ContractIngestionStep): string {
  switch (step.kind) {
    case "uploading":
      return "Enviando o PDF…";
    case "indexing":
      return "Lendo o contrato e indexando por cláusula…";
    case "extracting":
      return `Extraindo regras: ${CONTRACT_CATEGORY_LABELS[step.category]} (${step.index + 1}/${step.total})…`;
    default:
      return "";
  }
}

export function ContractUploadPanel({ onIngested }: { onIngested: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [operatorCode, setOperatorCode] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [contractLabel, setContractLabel] = useState("");
  const [step, setStep] = useState<ContractIngestionStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  const running =
    step?.kind === "uploading" || step?.kind === "indexing" || step?.kind === "extracting";
  const fileError =
    file && file.type !== "application/pdf"
      ? "Envie o contrato em PDF."
      : file && file.size > MAX_BYTES
        ? "O PDF passa de 25 MB."
        : null;
  const codeError = operatorCode && !/^\d{6}$/.test(operatorCode) ? "6 dígitos." : null;
  const canSubmit =
    !!file && !fileError && /^\d{6}$/.test(operatorCode) && contractLabel.trim() && !running;

  async function submit() {
    if (!file) return;
    setError(null);
    try {
      await ingestOperatorContract(
        {
          file,
          operatorCode,
          operatorName: operatorName.trim(),
          contractLabel: contractLabel.trim(),
        },
        setStep,
      );
      onIngested();
    } catch (err) {
      setStep(null);
      setError(err instanceof Error ? err.message : String(err));
      onIngested();
    }
  }

  return (
    <section
      aria-label="Enviar contrato de operadora"
      className="mb-6 rounded-xl border border-border bg-card p-4 space-y-3"
    >
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <FileUp className="h-4 w-4 text-primary" /> Enviar contrato de operadora
      </h2>
      <p className="text-xs text-muted-foreground">
        O PDF é lido cláusula por cláusula e a IA propõe regras citando o trecho de onde tirou cada
        uma. Nenhuma regra vale antes da revisão humana.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="cu-file">
            PDF do contrato (com texto selecionável, até 25 MB)
          </label>
          <input
            id="cu-file"
            type="file"
            accept="application/pdf"
            disabled={running}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          {file ? (
            <p
              className={
                fileError ? "mt-1 text-xs text-destructive" : "mt-1 text-xs text-muted-foreground"
              }
            >
              {fileError ?? `${file.name} · ${formatFileSize(file.size)}`}
            </p>
          ) : null}
        </div>
        <div>
          <label className={LABEL} htmlFor="cu-ans">
            Código ANS da operadora
          </label>
          <input
            id="cu-ans"
            className={INPUT}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={operatorCode}
            disabled={running}
            onChange={(e) => setOperatorCode(e.target.value.replace(/\D/g, ""))}
          />
          {codeError ? <p className="mt-1 text-xs text-destructive">{codeError}</p> : null}
        </div>
        <div>
          <label className={LABEL} htmlFor="cu-name">
            Nome da operadora (opcional)
          </label>
          <input
            id="cu-name"
            className={INPUT}
            maxLength={160}
            value={operatorName}
            disabled={running}
            onChange={(e) => setOperatorName(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="cu-label">
            Identificação do contrato
          </label>
          <input
            id="cu-label"
            className={INPUT}
            maxLength={120}
            placeholder="Ex.: UNIMED-2026"
            value={contractLabel}
            disabled={running}
            onChange={(e) => setContractLabel(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => void submit()}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
        {running ? "Processando…" : "Enviar e extrair regras"}
      </button>

      <div aria-live="polite" className="text-sm">
        {running && step ? <p className="text-muted-foreground">{stepText(step)}</p> : null}
        {step?.kind === "already_indexed" ? (
          <p>
            Este contrato já estava indexado.{" "}
            <Link
              to="/contratos/revisao/$contractId"
              params={{ contractId: step.contractId }}
              className="font-medium text-primary hover:underline"
            >
              Abrir revisão
            </Link>
          </p>
        ) : null}
        {step?.kind === "done" ? (
          <p>
            Contrato indexado: {step.proposals} proposta(s) de regra aguardando revisão.{" "}
            {step.failedCategories.length > 0
              ? `Falhou em: ${step.failedCategories.join(", ")}. `
              : ""}
            <Link
              to="/contratos/revisao/$contractId"
              params={{ contractId: step.contractId }}
              className="font-medium text-primary hover:underline"
            >
              Revisar agora
            </Link>
          </p>
        ) : null}
        {error ? <p className="text-destructive">{error}</p> : null}
      </div>
    </section>
  );
}
