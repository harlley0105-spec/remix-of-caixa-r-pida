/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ensureLedgerEntry,
  syncLedgerEntry,
  useCompany,
  useDeleteRowWithLedger,
  useList,
  useSaveRow,
  type Row,
} from "@/lib/data";
import { formatDate, today } from "@/lib/format";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RecordCard, StatusTag } from "@/components/record-card";
import { FormDialog, type Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — Caixa Simples" },
      { name: "description", content: "Registre as despesas do seu negócio por categoria e data." },
      { property: "og:title", content: "Despesas — Caixa Simples" },
      { property: "og:description", content: "Controle das despesas do seu negócio." },
    ],
  }),
  component: Despesas,
});

const FIELDS: Field[] = [
  {
    name: "category",
    label: "Categoria",
    placeholder: "Ex.: aluguel, energia, insumos, transporte",
  },
  { name: "amount", label: "Valor", type: "money", required: true },
  { name: "spent_on", label: "Data", type: "date", required: true },
  { name: "description", label: "Descrição", required: true },
  {
    name: "status",
    label: "Situação",
    type: "select",
    options: [
      { value: "pendente", label: "Ainda não paguei" },
      { value: "paga", label: "Já paguei" },
    ],
  },
];

function Despesas() {
  const { data, isLoading, isError, refetch } = useList("expenses", "spent_on");
  const { data: profile } = useCompany();
  const save = useSaveRow("expenses");
  const remove = useDeleteRowWithLedger("expenses", "expense");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row<"expenses"> | null>(null);

  async function marcarPaga(expense: Row<"expenses">) {
    if (!profile?.company_id) return;
    try {
      await ensureLedgerEntry({
        companyId: profile.company_id,
        kind: "saida",
        amount: Number(expense.amount),
        occurred_on: expense.spent_on,
        category: expense.category ?? "Despesas",
        description: expense.description || "Despesa",
        sourceType: "expense",
        sourceId: expense.id,
      });
      await supabase.from("expenses").update({ status: "paga" }).eq("id", expense.id);
      queryClient.invalidateQueries();
      toast.success("Despesa paga registrada no caixa.");
    } catch {
      toast.error("Não foi possível registrar agora. Tente novamente em instantes.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Despesas"
        subtitle="Ao marcar como paga, a saída entra no caixa."
        action={
          <Button
            variant="acao"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Nova despesa
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="Nenhuma despesa registrada ainda." />
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((expense) => (
            <RecordCard
              key={expense.id}
              title={expense.description || "Despesa"}
              subtitle={`${formatDate(expense.spent_on)}${
                expense.category ? ` · ${expense.category}` : ""
              }`}
              amount={expense.amount}
              tone="saida"
              badge={<StatusTag status={expense.status} />}
              actions={
                expense.status === "pendente" ? (
                  <Button size="sm" variant="saida" onClick={() => marcarPaga(expense)}>
                    Marcar como paga
                  </Button>
                ) : null
              }
              onEdit={() => {
                setEditing(expense);
                setOpen(true);
              }}
              onDelete={() =>
                remove.mutate(expense.id, { onSuccess: () => toast.success("Despesa excluída.") })
              }
            />
          ))}
        </ul>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar despesa" : "Nova despesa"}
        fields={FIELDS}
        initial={
          editing ? ({ ...editing } as any) : { spent_on: today(), status: "pendente" }
        }
        onSubmit={async (values) => {
          const id = await save.mutateAsync(values);
          if (values.status === "paga" && profile?.company_id) {
            await ensureLedgerEntry({
              companyId: profile.company_id,
              kind: "saida",
              amount: Number(values.amount ?? 0),
              occurred_on: values.spent_on,
              category: values.category ?? "Despesas",
              description: values.description || "Despesa",
              sourceType: "expense",
              sourceId: id,
            });
            await syncLedgerEntry("expense", id, {
              amount: Number(values.amount ?? 0),
              description: values.description || "Despesa",
            });
          } else {
            // Voltou para "pendente" — remove o lançamento que existia, se houver.
            await supabase.from("transactions").delete().eq("source_type", "expense").eq("source_id", id);
          }
          toast.success("Despesa salva.");
        }}
      />
    </div>
  );
}