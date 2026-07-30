import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useList } from "@/lib/data";
import { formatDate, formatMoney, monthRange, weekAhead } from "@/lib/format";
import { buildProgress, monthRef } from "@/lib/budget";
import { BudgetBar } from "@/components/budget-bar";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RecordCard } from "@/components/record-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Caixa Simples" },
      {
        name: "description",
        content: "Saldo atual, contas da semana, lucro estimado do mês e lançamentos recentes.",
      },
      { property: "og:title", content: "Painel — Caixa Simples" },
      { property: "og:description", content: "Resumo do dinheiro do seu negócio." },
    ],
  }),
  component: Painel,
});

function Painel() {
  const transactions = useList("transactions", "occurred_on");
  const payables = useList("payables", "due_on", true);
  const receivables = useList("receivables", "due_on", true);
  const budgets = useList("budgets", "category", true);

  if (transactions.isLoading || payables.isLoading || receivables.isLoading)
    return <LoadingState />;
  if (transactions.isError || payables.isError || receivables.isError)
    return <ErrorState onRetry={() => transactions.refetch()} />;

  const rows = transactions.data ?? [];
  const saldo = rows.reduce(
    (acc, t) => acc + (t.kind === "entrada" ? Number(t.amount) : -Number(t.amount)),
    0,
  );

  const { start, end } = monthRange();
  const mes = rows.filter((t) => t.occurred_on >= start && t.occurred_on <= end);
  const entradasMes = mes
    .filter((t) => t.kind === "entrada")
    .reduce((a, t) => a + Number(t.amount), 0);
  const saidasMes = mes.filter((t) => t.kind === "saida").reduce((a, t) => a + Number(t.amount), 0);

  const mesRef = monthRef();
  const orcamentos = buildProgress(
    (budgets.data ?? []).filter((b) => b.month_ref === mesRef),
    mes.filter((t) => t.kind === "saida"),
  );
  const emAlerta = orcamentos.filter((o) => o.pct >= 90);

  const semana = weekAhead();
  const aPagar = (payables.data ?? []).filter(
    (p) => p.status === "pendente" && p.due_on <= semana.end,
  );
  const aReceber = (receivables.data ?? []).filter(
    (r) => r.status === "pendente" && r.due_on <= semana.end,
  );
  const atrasados = aPagar.filter((p) => p.due_on < semana.start).length +
    aReceber.filter((r) => r.due_on < semana.start).length;

  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const { start: s, end: e } = monthRange(d);
    const doMes = rows.filter((t) => t.occurred_on >= s && t.occurred_on <= e);
    return {
      mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      entrada: doMes.filter((t) => t.kind === "entrada").reduce((a, t) => a + Number(t.amount), 0),
      saida: doMes.filter((t) => t.kind === "saida").reduce((a, t) => a + Number(t.amount), 0),
    };
  });
  const temHistorico = meses.some((m) => m.entrada > 0 || m.saida > 0);

  return (
    <div>
      <PageHeader
        title="Painel"
        subtitle="Como está o dinheiro do seu negócio hoje."
        action={
          <Button asChild variant="acao">
            <Link to="/caixa">Novo lançamento</Link>
          </Button>
        }
      />

      <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-2xl bg-capa p-6 text-capa-foreground shadow-capa">
        <p className="text-xs uppercase tracking-[0.2em] text-capa-foreground/50">Saldo atual</p>
        <p className="valor mt-2 text-4xl font-semibold">{formatMoney(saldo)}</p>
        <p className="mt-2 text-xs text-capa-foreground/50">
          Tudo que entrou menos tudo que saiu, desde o começo.
        </p>
      </section>

      {temHistorico ? (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 mt-6 rounded-xl border border-border bg-card p-4 shadow-livro">
          <h2 className="font-display text-lg">Entradas x saídas — últimos 6 meses</h2>
          <div className="mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={meses} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="corEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-entrada)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-entrada)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="corSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-saida)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-saida)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => formatMoney(value)}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="entrada"
                  stroke="var(--color-entrada)"
                  fill="url(#corEntrada)"
                  strokeWidth={2}
                  name="Entradas"
                />
                <Area
                  type="monotone"
                  dataKey="saida"
                  stroke="var(--color-saida)"
                  fill="url(#corSaida)"
                  strokeWidth={2}
                  name="Saídas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 mt-6">
        <h2 className="font-display text-lg">
          Vence nesta semana{atrasados > 0 ? ` (${atrasados} atrasada${atrasados > 1 ? "s" : ""})` : ""}
        </h2>
        {aPagar.length === 0 && aReceber.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nada vencendo nos próximos 7 dias.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {aPagar.map((p) => (
              <RecordCard
                key={p.id}
                title={`Pagar: ${p.supplier}`}
                subtitle={p.due_on < semana.start ? `Atrasada desde ${formatDate(p.due_on)}` : `Vence em ${formatDate(p.due_on)}`}
                amount={p.amount}
                tone="saida"
              />
            ))}
            {aReceber.map((r) => (
              <RecordCard
                key={r.id}
                title={`Receber de ${r.client_name}`}
                subtitle={r.due_on < semana.start ? `Atrasada desde ${formatDate(r.due_on)}` : `Vence em ${formatDate(r.due_on)}`}
                amount={r.amount}
                tone="entrada"
              />
            ))}
          </ul>
        )}
      </section>

      <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 mt-6 grid gap-3 sm:grid-cols-3">
        <Resumo rotulo="Entrou no mês" valor={entradasMes} tone="entrada" />
        <Resumo rotulo="Saiu no mês" valor={saidasMes} tone="saida" />
        <Resumo rotulo="Lucro estimado" valor={entradasMes - saidasMes} destaque />
      </section>

      {orcamentos.length > 0 ? (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 mt-6 rounded-xl border border-border bg-card p-4 shadow-livro">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg">Orçamento do mês</h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/orcamento">Ver tudo</Link>
            </Button>
          </div>
          {emAlerta.length > 0 ? (
            <p className="mt-2 rounded-md bg-saida-soft px-3 py-2 text-sm text-saida">
              Atenção: {emAlerta.map((o) => o.category).join(", ")}{" "}
              {emAlerta.length > 1 ? "passaram" : "passou"} de 90% do limite deste mês.
            </p>
          ) : null}
          <div className="mt-3 space-y-3">
            {orcamentos.slice(0, 4).map((item) => (
              <BudgetBar key={item.id} item={item} compact />
            ))}
          </div>
        </section>
      ) : null}

      <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 mt-6">
        <h2 className="font-display text-lg">Lançamentos recentes</h2>
        {rows.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              message="Nenhum lançamento ainda — registre sua primeira entrada ou saída."
              action={
                <Button asChild variant="acao">
                  <Link to="/caixa">Registrar agora</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {rows.slice(0, 6).map((t) => (
              <RecordCard
                key={t.id}
                title={t.description || (t.kind === "entrada" ? "Entrada" : "Saída")}
                subtitle={`${formatDate(t.occurred_on)}${t.category ? ` · ${t.category}` : ""}`}
                amount={t.amount}
                tone={t.kind === "entrada" ? "entrada" : "saida"}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-xs text-muted-foreground">
        Os cálculos são simples e servem apenas para a organização interna do seu negócio.
      </p>
    </div>
  );
}

function Resumo({
  rotulo,
  valor,
  tone,
  destaque,
}: {
  rotulo: string;
  valor: number;
  tone?: "entrada" | "saida";
  destaque?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-livro transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p
        className={`valor mt-1 text-xl font-semibold ${
          tone === "entrada" ? "text-entrada" : tone === "saida" ? "text-saida" : ""
        } ${destaque ? "text-acao" : ""}`}
      >
        {formatMoney(valor)}
      </p>
    </div>
  );
}