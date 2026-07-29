import { createFileRoute, Link } from "@tanstack/react-router";
import { useList } from "@/lib/data";
import { formatDate, formatMoney, monthRange, weekAhead } from "@/lib/format";
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

  const semana = weekAhead();
  const aPagar = (payables.data ?? []).filter(
    (p) => p.status === "pendente" && p.due_on <= semana.end,
  );
  const aReceber = (receivables.data ?? []).filter(
    (r) => r.status === "pendente" && r.due_on <= semana.end,
  );
  const atrasados = aPagar.filter((p) => p.due_on < semana.start).length +
    aReceber.filter((r) => r.due_on < semana.start).length;

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

      <section className="rounded-2xl bg-capa p-6 text-capa-foreground shadow-capa">
        <p className="text-xs uppercase tracking-[0.2em] text-capa-foreground/50">Saldo atual</p>
        <p className="valor mt-2 text-4xl font-semibold">{formatMoney(saldo)}</p>
        <p className="mt-2 text-xs text-capa-foreground/50">
          Tudo que entrou menos tudo que saiu, desde o começo.
        </p>
      </section>

      <section className="mt-6">
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

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Resumo rotulo="Entrou no mês" valor={entradasMes} tone="entrada" />
        <Resumo rotulo="Saiu no mês" valor={saidasMes} tone="saida" />
        <Resumo rotulo="Lucro estimado" valor={entradasMes - saidasMes} destaque />
      </section>

      <section className="mt-6">
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
    <div className="rounded-xl border border-border bg-card p-4 shadow-livro">
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