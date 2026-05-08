import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-kit";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, ShieldCheck, Building2 } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — MedFlow-IA" },
      { name: "description", content: "Suas configurações e disponibilidade." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  return (
    <AppShell>
      <PageHeader title="Perfil" />

      <div className="rounded-xl bg-card border border-border ring-soft p-5 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">AL</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="text-base font-semibold truncate">Dra. Ana Lima</h2>
          <p className="text-xs text-muted-foreground">Intensivista · CRM/SP 123.456</p>
          <p className="text-xs text-muted-foreground mt-0.5">Hospital São José</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <Row icon={<Bell className="h-4 w-4" />} title="Disponível para plantões" desc="Receber convites em tempo real">
          <Switch defaultChecked />
        </Row>
        <Row icon={<ShieldCheck className="h-4 w-4" />} title="Notificações de troca" desc="Avisar sobre solicitações">
          <Switch defaultChecked />
        </Row>
        <Row icon={<Building2 className="h-4 w-4" />} title="Instituição" desc="Hospital São José · Ativo">
          <Button variant="ghost" size="sm">Trocar</Button>
        </Row>
      </div>

      <div className="mt-6">
        <Button asChild variant="outline" className="w-full gap-2">
          <Link to="/login">
            <LogOut className="h-4 w-4" /> Sair da conta
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}

function Row({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card border border-border ring-soft p-4">
      <span className="h-9 w-9 grid place-items-center rounded-lg bg-muted text-primary">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}
