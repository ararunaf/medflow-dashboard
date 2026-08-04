import {
  ClipboardCheck,
  Layers,
  MessageSquareWarning,
  ScanLine,
  Stethoscope,
  Wallet,
} from "lucide-react";
import { can, isOperationalManager } from "@/lib/auth/rbac";
import type { NavRole, QuickAction } from "./types";

/**
 * Quick Actions do Centro Operacional (UI-only).
 * Prioridade: Processamento → Captura → OCR → Auditoria → Correções → Plantão → Financeiro.
 */
const DOCUMENTAL_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "qa-processamento",
    label: "Processamento",
    to: "/processamento",
    icon: Layers,
    require: "financial",
    description: "Filas de guias",
  },
  {
    id: "qa-captura",
    label: "Captura",
    to: "/captura",
    icon: ScanLine,
    require: "financial",
    description: "Nova captura",
  },
  {
    id: "qa-ocr",
    label: "OCR",
    to: "/processamento",
    search: { queue: "ocr_pendente" },
    icon: ScanLine,
    require: "financial",
    description: "Fila OCR",
  },
  {
    id: "qa-auditoria",
    label: "Auditoria",
    to: "/processamento",
    search: { queue: "auditoria" },
    icon: ClipboardCheck,
    require: "financial",
    description: "Fila auditoria",
  },
  {
    id: "qa-correcoes",
    label: "Correções",
    to: "/processamento",
    search: { queue: "correcao" },
    icon: MessageSquareWarning,
    require: "financial",
    description: "Pendências",
  },
  {
    id: "qa-plantao",
    label: "Pega Plantão",
    to: "/plantoes",
    icon: Stethoscope,
    description: "Plantões",
  },
  {
    id: "qa-financeiro",
    label: "Financeiro",
    to: "/financeiro",
    icon: Wallet,
    require: "financial",
    description: "Hub financeiro",
  },
];

export function quickActionsForRole(role: NavRole): QuickAction[] {
  return DOCUMENTAL_QUICK_ACTIONS.filter((action) => {
    if (!action.require) return true;
    if (action.require === "financial") return can(role, "financial_closing:read");
    if (action.require === "tenant_settings_read") return can(role, "tenant_settings:read");
    if (action.require === "operational_manager") return isOperationalManager(role);
    return true;
  });
}
