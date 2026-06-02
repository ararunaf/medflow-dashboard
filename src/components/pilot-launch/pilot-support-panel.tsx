import { Link } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";
import {
  buildPilotOperationalStatus,
  pilot_troubleshoot_quick,
  type PilotDiagnosticExport,
} from "@/lib/services/pilot-support";

export function PilotSupportPanel({
  contactEmail,
  supportPhone,
  operationalStatus,
  onExportDiagnostic,
}: {
  contactEmail?: string | null;
  supportPhone?: string | null;
  operationalStatus: ReturnType<typeof buildPilotOperationalStatus>;
  onExportDiagnostic: () => void;
}) {
  const hasContact = !!(contactEmail?.trim() || supportPhone?.trim());

  return (
    <section className="rounded-xl border border-border bg-card ring-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <LifeBuoy className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Suporte operacional inicial</h2>
      </div>

      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {operationalStatus.map((s) => (
          <div
            key={s.label}
            className={`rounded-lg border px-3 py-2 text-xs ${
              s.ok
                ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/5"
                : "border-border bg-muted/20"
            }`}
          >
            <div className="font-medium text-foreground">{s.label}</div>
            <div className="text-muted-foreground mt-0.5">{s.detail}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contato institucional
          </h3>
          <p className="text-sm mt-1 text-foreground">{contactEmail?.trim() || "—"}</p>
          <p className="text-sm text-foreground">{supportPhone?.trim() || ""}</p>
          {!hasContact ? (
            <Link
              to="/instituicao"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              Configurar em Instituição →
            </Link>
          ) : null}
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Troubleshooting rápido
          </h3>
          <ul className="mt-1 space-y-2 text-xs text-muted-foreground">
            {pilot_troubleshoot_quick.map((t) => (
              <li key={t.id}>
                <span className="font-medium text-foreground">{t.title}</span> — {t.fix}
                {t.route ? (
                  <>
                    {" "}
                    <Link to={t.route} className="text-primary hover:underline">
                      Abrir
                    </Link>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        type="button"
        className="mt-4 inline-flex items-center rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
        onClick={onExportDiagnostic}
      >
        Exportar diagnóstico piloto (JSON)
      </button>
    </section>
  );
}

export type { PilotDiagnosticExport };
