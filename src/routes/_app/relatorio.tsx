import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useList } from "@/lib/data";
import { formatMoney, monthLabel, monthRange } from "@/lib/format";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/relatorio")({
  head: () => ({
    meta: [
      { title: "Relatório do mês — Caixa Simples" },
      {
        name: "description",
        content: "Total de entradas, saídas, lucro estimado e maiores categorias do mês.",
      },
      { property: "og:title", content: "Relatório do mês — Caixa Simples" },
      { property: "og:description", content: "Resumo mensal do seu negócio." },
    ],
  }),
  component: Relatorio,
});

function shiftMonth(base: Date, delta: number) {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

function Relatorio() {
  const [ref, setRef] = useState(() => new Date());
  const { data, isLoading, isError, refetch } = useList("transactions", "occurred_on");
  const range = useMemo(() => monthRange(ref), [ref]);

  const rows = useMemo(
    () => (data ?? []).filter((t) => t.occurred_on >= range.start && t.occurred_on <= range.end),
    [data, range],
  );

  const entradas = rows.filter((t) => t.kind === "entrada").reduce((a, t) => a + Number(t.amount), 0);
  const saidas = rows.filter((t) => t.kind === "saida").reduce((a, t) => a + Number(t.amount), 0);

  const categorias = useMemo(() => {
    const map = new Map<string, number>();
    rows
      .filter((t) => t.kind === "saida")
      .forEach((t) => {
        const key = t.category?.trim() || "Sem categoria";
        map.set(key, (map.get(key) ?? 0) + Number(t.amount));
      });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Relatório do mês"
        subtitle="Um resumo simples para entender o mês."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRef((d) => shiftMonth(d, -1))}>
              Mês anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRef((d) => shiftMonth(d, 1))}>
              Próximo mês
            </Button>
          </div>
        }
      />

      <p className="mb-4 text-sm text-muted-foreground">{monthLabel(ref)}</p>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState message="Nenhum lançamento neste mês ainda." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card rotulo="Total de entradas" valor={entradas} className="text-entrada" />
            <Card rotulo="Total de saídas" valor={saidas} className="text-saida" />
            <Card rotulo="Lucro estimado" valor={entradas - saidas} className="text-acao" />
          </div>

          <section className="mt-6 rounded-xl border border-border bg-card p-4 shadow-livro">
            <h2 className="font-display text-lg">Maiores gastos por categoria</h2>
            {categorias.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Sem saídas neste mês.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {categorias.map(([nome, valor]) => (
                  <li key={nome}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{nome}</span>
                      <span className="valor">{formatMoney(valor)}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-saida"
                        style={{ width: `${saidas ? (valor / saidas) * 100 : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="mt-6 text-xs text-muted-foreground">
            Lucro estimado = entradas − saídas do período. É uma estimativa para organização
            interna, não substitui a sua contabilidade.
          </p>
        </>
      )}
    </div>
  );
}

function Card({
  rotulo,
  valor,
  className,
}: {
  rotulo: string;
  valor: number;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-livro">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className={`valor mt-1 text-xl font-semibold ${className ?? ""}`}>{formatMoney(valor)}</p>
    </div>
  );
}