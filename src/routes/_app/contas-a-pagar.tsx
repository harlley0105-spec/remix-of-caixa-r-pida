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

export const Route = createFileRoute("/_app/contas-a-pagar")({
  head: () => ({
    meta: [
      { title: "Contas a pagar — Caixa Simples" },
      { name: "description", content: "Acompanhe vencimentos e marque contas como pagas." },
      { property: "og:title", content: "Contas a pagar — Caixa Simples" },
      { property: "og:description", content: "O que vence e o que já foi pago." },
    ],
  }),
  component: ContasAPagar,
});

const FIELDS: Field[] = [
  { name: "supplier", label: "Fornecedor", required: true },
  { name: "amount", label: "Valor", type: "money", required: true },
  { name: "due_on", label: "Vencimento", type: "date", required: true },
  { name: "notes", label: "Observação", type: "textarea" },
];

function ContasAPagar() {
  const { data, isLoading, isError, refetch } = useList("payables", "due_on", true);
  const { data: profile } = useCompany();
  const save = useSaveRow("payables");
  const remove = useDeleteRowWithLedger("payables", "payable");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row<"payables"> | null>(null);

  async function marcarPaga(row: Row<"payables">) {
    if (!profile?.company_id) return;
    try {
      await ensureLedgerEntry({
        companyId: profile.company_id,
        kind: "saida",
        amount: Number(row.amount),
        occurred_on: today(),
        category: "Contas a pagar",
        description: `Pagamento: ${row.supplier}`,
        sourceType: "payable",
        sourceId: row.id,
      });
      await supabase.from("payables").update({ status: "paga" }).eq("id", row.id);
      queryClient.invalidateQueries();
      toast.success("Conta paga registrada no caixa.");
    } catch {
      toast.error("Não foi possível registrar agora. Tente novamente em instantes.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Contas a pagar"
        subtitle="Ao marcar como paga, a saída entra no caixa."
        action={
          <Button
            variant="acao"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Nova conta
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="Nenhuma conta a pagar cadastrada." />
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((row) => (
            <RecordCard
              key={row.id}
              title={row.supplier}
              subtitle={`Vence em ${formatDate(row.due_on)}`}
              amount={row.amount}
              tone="saida"
              badge={<StatusTag status={row.status} />}
              actions={
                row.status === "pendente" ? (
                  <Button size="sm" variant="saida" onClick={() => marcarPaga(row)}>
                    Marcar como paga
                  </Button>
                ) : null
              }
              onEdit={() => {
                setEditing(row);
                setOpen(true);
              }}
              onDelete={() =>
                remove.mutate(row.id, { onSuccess: () => toast.success("Conta excluída.") })
              }
            />
          ))}
        </ul>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar conta" : "Nova conta a pagar"}
        fields={FIELDS}
        initial={editing ? ({ ...editing } as any) : { due_on: today(), status: "pendente" }}
        onSubmit={async (values) => {
          const id = await save.mutateAsync(values);
          if (values.status === "paga") {
            // Se essa conta já estava paga e foi editada, mantém o lançamento no
            // Caixa com o valor/data atualizados em vez de deixar desatualizado.
            await syncLedgerEntry("payable", id, {
              amount: Number(values.amount ?? 0),
              description: `Pagamento: ${values.supplier}`,
            });
          }
          toast.success("Conta salva.");
        }}
      />
    </div>
  );
}