/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useDeleteRow, useList, useSaveRow, type Row } from "@/lib/data";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RecordCard } from "@/components/record-card";
import { FormDialog, type Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Caixa Simples" },
      { name: "description", content: "Cadastro simples de clientes com WhatsApp e observações." },
      { property: "og:title", content: "Clientes — Caixa Simples" },
      { property: "og:description", content: "Seus clientes em um só lugar." },
    ],
  }),
  component: Clientes,
});

const FIELDS: Field[] = [
  { name: "name", label: "Nome", required: true },
  { name: "whatsapp", label: "WhatsApp", placeholder: "Ex.: 5511999999999" },
  { name: "email", label: "E-mail" },
  { name: "notes", label: "Observação", type: "textarea" },
];

function Clientes() {
  const { data, isLoading, isError, refetch } = useList("clients", "name", true);
  const save = useSaveRow("clients");
  const remove = useDeleteRow("clients");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row<"clients"> | null>(null);

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Quem compra de você."
        action={
          <Button
            variant="acao"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Novo cliente
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="Nenhum cliente cadastrado ainda." />
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((client) => (
            <RecordCard
              key={client.id}
              title={client.name}
              subtitle={[client.whatsapp, client.email].filter(Boolean).join(" · ") || undefined}
              meta={client.notes ? <span className="text-sm">{client.notes}</span> : undefined}
              onEdit={() => {
                setEditing(client);
                setOpen(true);
              }}
              onDelete={() =>
                remove.mutate(client.id, { onSuccess: () => toast.success("Cliente excluído.") })
              }
            />
          ))}
        </ul>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar cliente" : "Novo cliente"}
        fields={FIELDS}
        initial={editing ? ({ ...editing } as any) : {}}
        onSubmit={async (values) => {
          await save.mutateAsync(values);
          toast.success("Cliente salvo.");
        }}
      />
    </div>
  );
}