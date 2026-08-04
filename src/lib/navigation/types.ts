import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/lib/database.types";

/** Gates de menu — espelham os mesmos checks já usados no AppShell (sem alterar RBAC). */
export type NavRequire = "financial" | "tenant_settings_read" | "operational_manager";

export type NavItem = {
  id: string;
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  require?: NavRequire;
  /** Search tipado como Record simples para deep links de fila (ex.: auditoria). */
  search?: Record<string, string>;
  /** Item reservado para Fase 3 — rota placeholder, sem funcionalidade. */
  placeholder?: boolean;
};

export type NavGroupId =
  | "operacao"
  | "clinico"
  | "faturamento"
  | "monitoramento"
  | "ia"
  | "administracao";

export type NavGroup = {
  id: NavGroupId;
  label: string;
  /** Destaque visual (OPERAÇÃO). */
  accent?: boolean;
  defaultOpen?: boolean;
  items: NavItem[];
};

export type BreadcrumbCrumb = {
  label: string;
  to?: string;
};

export type QuickAction = {
  id: string;
  label: string;
  to: string;
  search?: Record<string, string>;
  icon: LucideIcon;
  require?: NavRequire;
  description?: string;
};

export type NavRole = UserRole | null | undefined;
