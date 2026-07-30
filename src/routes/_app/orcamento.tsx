/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useDeleteRow, useList, useSaveRow, type Row } from "@/lib/data";
import { monthLabel, monthRange } from "@/lib/format";
import { buildProgress, monthRef } from "@/lib/budget";
import { BudgetBar } from "@/components/budget-bar";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { FormDialog, type Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/orcamento")({
  head: () => ({
    meta: [
      { title: "Orçamento por categoria — Caixa Simples" },
      {
        name: "description",
        content:
          "Defina um teto de gasto por categoria e acompanhe quanto já foi usado no mês.",
      },
      { property: "og:title", content: "Orçamento por categoria — Caixa Simples" },
      { property: "og:description", content: "Limites de gasto por categoria do seu negócio." },
    ],
  }),
  component: Orcamento,
});

const FIELDS: Field[] = [
  {
    name: "category",
    label: "Categoria",
    required: true,
    placeholder: "Ex.: fornecedores, combustível, energia",
    hint: "Use o mesmo nome que você escreve nas despesas e saídas do caixa.",
  },
  { name: "limit_amount", label: "Limite do mês", type: "money", required: true },
];

function shiftMonth(base: Date, delta: number) {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

function Orcamento() {
  const [ref, setRef] = useState(() => new Date());
  const budgets = useList("budgets", "category", true);
  const transactions = useList("transactions", "occurred_on");
  const save = useSaveRow("budgets");
  const remove = useDeleteRow("budgets");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row<"budgets"> | null>(null);

  const mesRef = monthRef(ref);
  const range = useMemo(() => monthRange(ref), [ref]);

  const doMes = (budgets.data ?? []).filter((b) => b.month_ref === mesRef);
  const saidas = (transactions.data ?? []).filter(
    (t) => t.kind === "saida" && t.occurred_on >= range.start && t.occurred_on <= range.end,
  );
  const progresso = buildProgress(doMes as any, saidas);

  const isLoading = budgets.isLoading || transactions.isLoading;
  const isError = budgets.isError || transactions.isError;

  return (
    <div>
      <PageHeader
        title="Orçamento"
        subtitle="Um teto de gasto por categoria, para não estourar sem perceber."
        action={
          <Button
            variant="acao"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Novo orçamento
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setRef((d) => shiftMonth(d, -1))}>
          Mês anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => setRef((d) => shiftMonth(d, 1))}>
          Próximo mês
        </Button>
        <span className="text-sm text-muted-foreground">{monthLabel(ref)}</span>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => budgets.refetch()} />
      ) : progresso.length === 0 ? (
        <EmptyState
          message="Nenhum orçamento definido para este mês. Cadastre um limite por categoria (ex.: Fornecedores R$ 2.000)."
          action={
            <Button
              variant="acao"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Criar orçamento
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {progresso.map((item) => {
            const row = doMes.find((b) => b.id === item.id)!;
            return (
              <li
                key={item.id}
                className="animate-in fade-in slide-in-from-bottom-1 rounded-xl border border-border bg-card p-4 shadow-livro"
              >
                <BudgetBar item={item} />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(row);
                      setOpen(true);
                    }}
                  >
                    <Pencil /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-saida"
                    onClick={() =>
                      remove.mutate(row.id, {
                        onSuccess: () => toast.success("Orçamento excluído."),
                      })
                    }
                  >
                    <Trash2 /> Excluir
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        O gasto considera todas as saídas do caixa daquele mês cuja categoria tenha o mesmo nome
        (maiúsculas e minúsculas não importam).
      </p>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar orçamento" : "Novo orçamento"}
        description={`Vale para ${monthLabel(ref)}.`}
        fields={FIELDS}
        initial={editing ? ({ ...editing } as any) : { month_ref: mesRef }}
        onSubmit={async (values) => {
          await save.mutateAsync({ ...values, month_ref: values.month_ref ?? mesRef });
          toast.success("Orçamento salvo.");
        }}
      />
    </div>
  );
}