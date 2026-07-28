/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useDeleteRow, useList, useSaveRow, type Row } from "@/lib/data";
import { formatDate, today } from "@/lib/format";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RecordCard } from "@/components/record-card";
import { FormDialog, type Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/lembretes")({
  head: () => ({
    meta: [
      { title: "Lembretes — Caixa Simples" },
      { name: "description", content: "Prazos, cobranças e tarefas do negócio em um só lugar." },
      { property: "og:title", content: "Lembretes — Caixa Simples" },
      { property: "og:description", content: "Não perca mais nenhum prazo." },
    ],
  }),
  component: Lembretes,
});

const FIELDS: Field[] = [
  { name: "title", label: "Lembrete", required: true },
  { name: "due_on", label: "Data", type: "date", required: true },
  {
    name: "kind",
    label: "Tipo",
    type: "select",
    options: [
      { value: "geral", label: "Geral" },
      { value: "cobranca", label: "Cobrança" },
      { value: "pagamento", label: "Pagamento" },
      { value: "imposto", label: "Imposto / DAS" },
    ],
  },
  { name: "notes", label: "Observação", type: "textarea" },
  { name: "done", label: "Concluído", type: "switch" },
];

function Lembretes() {
  const { data, isLoading, isError, refetch } = useList("reminders", "due_on", true);
  const save = useSaveRow("reminders");
  const remove = useDeleteRow("reminders");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row<"reminders"> | null>(null);

  return (
    <div>
      <PageHeader
        title="Lembretes"
        subtitle="Prazos e tarefas para não esquecer."
        action={
          <Button
            variant="acao"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Novo lembrete
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="Nenhum lembrete cadastrado." />
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((item) => (
            <RecordCard
              key={item.id}
              title={item.done ? `✓ ${item.title}` : item.title}
              subtitle={`${formatDate(item.due_on)} · ${item.kind}`}
              meta={item.notes ? <span className="text-sm">{item.notes}</span> : undefined}
              actions={
                item.done ? null : (
                  <Button
                    size="sm"
                    variant="entrada"
                    onClick={() =>
                      save.mutate(
                        { id: item.id, done: true },
                        { onSuccess: () => toast.success("Lembrete concluído.") },
                      )
                    }
                  >
                    Concluir
                  </Button>
                )
              }
              onEdit={() => {
                setEditing(item);
                setOpen(true);
              }}
              onDelete={() =>
                remove.mutate(item.id, { onSuccess: () => toast.success("Lembrete excluído.") })
              }
            />
          ))}
        </ul>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar lembrete" : "Novo lembrete"}
        fields={FIELDS}
        initial={
          editing ? ({ ...editing } as any) : { due_on: today(), kind: "geral", done: false }
        }
        onSubmit={async (values) => {
          await save.mutateAsync(values);
          toast.success("Lembrete salvo.");
        }}
      />
    </div>
  );
}