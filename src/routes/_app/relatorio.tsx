import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useList } from "@/lib/data";
import { formatMoney, monthLabel, monthRange } from "@/lib/format";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";

const CORES_CATEGORIA = [
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-1)",
  "var(--color-chart-5)",
];

function Variacao({ atual, anterior }: { atual: number; anterior: number }) {
  if (anterior === 0) {
    return (
      <p className="mt-1 text-xs text-muted-foreground">
        {atual === 0 ? "Sem movimento no mês passado." : "Novo em relação ao mês passado."}
      </p>
    );
  }
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  const seta = pct > 0 ? "▲" : pct < 0 ? "▼" : "■";
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {seta} {Math.abs(pct).toFixed(0)}% vs. mês passado
    </p>
  );
}

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
  const rangeAnterior = useMemo(() => monthRange(shiftMonth(ref, -1)), [ref]);

  const rows = useMemo(
    () => (data ?? []).filter((t) => t.occurred_on >= range.start && t.occurred_on <= range.end),
    [data, range],
  );
  const rowsAnterior = useMemo(
    () =>
      (data ?? []).filter(
        (t) => t.occurred_on >= rangeAnterior.start && t.occurred_on <= rangeAnterior.end,
      ),
    [data, rangeAnterior],
  );

  const entradas = rows.filter((t) => t.kind === "entrada").reduce((a, t) => a + Number(t.amount), 0);
  const saidas = rows.filter((t) => t.kind === "saida").reduce((a, t) => a + Number(t.amount), 0);
  const entradasAnt = rowsAnterior
    .filter((t) => t.kind === "entrada")
    .reduce((a, t) => a + Number(t.amount), 0);
  const saidasAnt = rowsAnterior
    .filter((t) => t.kind === "saida")
    .reduce((a, t) => a + Number(t.amount), 0);

  const gastoAnteriorPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    rowsAnterior
      .filter((t) => t.kind === "saida")
      .forEach((t) => {
        const key = t.category?.trim() || "Sem categoria";
        map.set(key, (map.get(key) ?? 0) + Number(t.amount));
      });
    return map;
  }, [rowsAnterior]);

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
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 grid gap-3 sm:grid-cols-3">
            <Card rotulo="Total de entradas" valor={entradas} className="text-entrada">
              <Variacao atual={entradas} anterior={entradasAnt} />
            </Card>
            <Card rotulo="Total de saídas" valor={saidas} className="text-saida">
              <Variacao atual={saidas} anterior={saidasAnt} />
            </Card>
            <Card rotulo="Lucro estimado" valor={entradas - saidas} className="text-acao">
              <Variacao atual={entradas - saidas} anterior={entradasAnt - saidasAnt} />
            </Card>
          </div>

          <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 mt-6 grid gap-4 rounded-xl border border-border bg-card p-4 shadow-livro sm:grid-cols-2">
            <div>
              <h2 className="font-display text-lg">Maiores gastos por categoria</h2>
              {categorias.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Sem saídas neste mês.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {categorias.map(([nome, valor]: [string, number], i: number) => (
                    <li key={nome}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: CORES_CATEGORIA[i % CORES_CATEGORIA.length] }}
                          />
                          {nome}
                        </span>
                        <span className="valor">{formatMoney(valor)}</span>
                      </div>
                      <Variacao
                        atual={valor}
                        anterior={gastoAnteriorPorCategoria.get(nome) ?? 0}
                      />
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${saidas ? (valor / saidas) * 100 : 0}%`,
                            background: CORES_CATEGORIA[i % CORES_CATEGORIA.length],
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {categorias.length > 0 ? (
              <div className="h-48 sm:h-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorias.map(([nome, valor]: [string, number]) => ({ nome, valor }))}
                      dataKey="valor"
                      nameKey="nome"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={2}
                    >
                      {categorias.map(([nome]: [string, number], i: number) => (
                        <Cell key={nome} fill={CORES_CATEGORIA[i % CORES_CATEGORIA.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatMoney(value)}
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : null}
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
    <div className="rounded-xl border border-border bg-card p-4 shadow-livro transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className={`valor mt-1 text-xl font-semibold ${className ?? ""}`}>{formatMoney(valor)}</p>
    </div>
  );
}