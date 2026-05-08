import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-medflow.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — MedFlow-IA" },
      { name: "description", content: "Acesse sua operação hospitalar inteligente." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState("hospital-saojose");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex flex-1 bg-brand-gradient relative overflow-hidden">
        <div className="relative z-10 p-12 flex flex-col justify-between w-full text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 ring-1 ring-white/20 shadow-xl">
              <img
                src={logo}
                alt="MedFlow-IA"
                className="h-40 w-auto drop-shadow-lg"
                width={1024}
                height={1024}
              />
            </div>
            <div className="text-sm font-medium opacity-80">
              Plataforma Operacional
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-semibold leading-tight max-w-md">
              Inteligência que conecta. Operação que transforma.
            </h2>
            <p className="mt-4 text-base opacity-80 max-w-md">
              Escalas, plantões e indicadores clínicos em tempo real, em um único fluxo.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 bg-surface rounded-2xl p-6 border border-border">
            <img src={logo} alt="MedFlow-IA" style={{ height: "6.25rem" }} className="w-auto" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-center">Entrar</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Acesse sua operação hospitalar
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/" });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="tenant">Instituição</Label>
              <select
                id="tenant"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="hospital-saojose">Hospital São José</option>
                <option value="cooperativa-med">Cooperativa Med Brasil</option>
                <option value="grupo-vida">Grupo Vida Saúde</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="voce@hospital.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>

            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <Link
              to="/login"
              className="block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Esqueci minha senha
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
