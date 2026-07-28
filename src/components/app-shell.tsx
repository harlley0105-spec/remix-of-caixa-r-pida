import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/painel", label: "Painel" },
  { to: "/caixa", label: "Caixa" },
  { to: "/vendas", label: "Vendas" },
  { to: "/despesas", label: "Despesas" },
  { to: "/contas-a-pagar", label: "A pagar" },
  { to: "/contas-a-receber", label: "A receber" },
  { to: "/clientes", label: "Clientes" },
  { to: "/produtos", label: "Produtos" },
  { to: "/relatorio", label: "Relatório" },
  { to: "/lembretes", label: "Lembretes" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile } = useCompany();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const company = (profile as { companies?: { name?: string } } | null)?.companies?.name;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-capa text-capa-foreground shadow-capa">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight">Caixa Simples</p>
            <p className="truncate text-xs text-capa-foreground/60">{company ?? "Seu negócio"}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label="Sair"
              className="text-capa-foreground hover:bg-capa-muted hover:text-capa-foreground"
            >
              <LogOut />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Menu"
              className="text-capa-foreground hover:bg-capa-muted hover:text-capa-foreground md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        <nav
          className={cn(
            "mx-auto max-w-5xl px-2 pb-2",
            menuOpen ? "block" : "hidden md:block",
          )}
        >
          <ul className="flex flex-col gap-1 md:flex-row md:flex-wrap">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-acao text-acao-foreground font-semibold"
                        : "text-capa-foreground/75 hover:bg-capa-muted hover:text-capa-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-16">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}