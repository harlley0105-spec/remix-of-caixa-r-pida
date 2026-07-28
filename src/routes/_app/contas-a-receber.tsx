/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ensureLedgerEntry,
  useCompany,
  useDeleteRow,
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

export const Route = createFileRoute("/_app/contas-a-receber")({
  head: () => ({
    meta: [
      { title: "Contas a receber — Caixa Simples" },
      { name: "description", content: "Quem te deve, quanto e quando vence." },
      { property: "og:title", content: "Contas a receber — Caixa Simples" },
      { property: "og:description", content: "Cobranças em aberto do seu negócio." },
    ],
  }),
  component: ContasAReceber,
});

function ContasAReceber() {
  const { data, isLoading, isError, refetch } = useList("receivables", "due_on", true);
  const clients = useList("clients", "name", true);
  const { data: profile } = useCompany();
  const save = useSaveRow("receivables");
  const remove = useDeleteRow("receivables");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row<"receivables"> | null>(null);

  const fields: Field[] = [
    {
      name: "client_name",
      label: "Cliente",
      type: "select",
      options: (clients.data ?? []).map((c) => ({ value: c.name, label: c.name })),
      hint: "Cadastre em Clientes para aparecer aqui.",
    },
    { name: "amount", label: "Valor", type: "money", required: true },
    { name: "due_on", label: "Vencimento", type: "date", required: true },
    { name: "notes", label: "Observação", type: "textarea" },
  ];

  async function marcarRecebida(row: Row<"receivables">) {
    if (!profile?.company_id) return;
    try {
      await ensureLedgerEntry({
        companyId: profile.company_id,
        kind: "entrada",
        amount: Number(row.amount),
        occurred_on: today(),
        category: "Recebimentos",
        description: `Recebido de ${row.client_name}`,
        sourceType: "receivable",
        sourceId: row.id,
      });
      await supabase.from("receivables").update({ status: "recebido" }).eq("id", row.id);
      queryClient.invalidateQueries();
      toast.success("Recebimento registrado no caixa.");
    } catch {
      toast.error("Não foi possível registrar agora. Tente novamente em instantes.");
    }
  }

  function whatsappLink(row: Row<"receivables">) {
    const client = (clients.data ?? []).find((c) => c.name === row.client_name);
    if (!client?.whatsapp) return null;
    const phone = client.whatsapp.replace(/\D/g, "");
    if (!phone) return null;
    const texto = `Olá, ${row.client_name}! Passando para lembrar do valor de R$ ${Number(
      row.amount,
    ).toFixed(2)} com vencimento em ${formatDate(row.due_on)}. Obrigado!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`;
  }

  return (
    <div>
      <PageHeader
        title="Contas a receber"
        subtitle="Ao marcar como recebida, a entrada vai para o caixa."
        action={
          <Button
            variant="acao"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Nova cobrança
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="Nenhuma cobrança em aberto." />
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((row) => {
            const link = whatsappLink(row);
            return (
              <RecordCard
                key={row.id}
                title={row.client_name}
                subtitle={`Vence em ${formatDate(row.due_on)}`}
                amount={row.amount}
                tone="entrada"
                badge={<StatusTag status={row.status} />}
                actions={
                  <>
                    {row.status === "pendente" ? (
                      <Button size="sm" variant="entrada" onClick={() => marcarRecebida(row)}>
                        Marcar como recebida
                      </Button>
                    ) : null}
                    {link && row.status === "pendente" ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={link} target="_blank" rel="noreferrer">
                          Cobrar no WhatsApp
                        </a>
                      </Button>
                    ) : null}
                  </>
                }
                onEdit={() => {
                  setEditing(row);
                  setOpen(true);
                }}
                onDelete={() =>
                  remove.mutate(row.id, { onSuccess: () => toast.success("Cobrança excluída.") })
                }
              />
            );
          })}
        </ul>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar cobrança" : "Nova cobrança"}
        fields={fields}
        initial={editing ? ({ ...editing } as any) : { due_on: today(), status: "pendente" }}
        onSubmit={async (values) => {
          const client = (clients.data ?? []).find((c) => c.name === values.client_name);
          await save.mutateAsync({ ...values, client_id: client?.id ?? null });
          toast.success("Cobrança salva.");
        }}
      />
    </div>
  );
}