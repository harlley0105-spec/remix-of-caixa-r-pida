/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useDeleteRow, useList, useSaveRow, type Row } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RecordCard } from "@/components/record-card";
import { FormDialog, type Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos e serviços — Caixa Simples" },
      { name: "description", content: "Cadastre o que você vende, com preço e custo." },
      { property: "og:title", content: "Produtos e serviços — Caixa Simples" },
      { property: "og:description", content: "O que você vende, com preço e custo." },
    ],
  }),
  component: Produtos,
});

const FIELDS: Field[] = [
  { name: "name", label: "Nome", required: true },
  {
    name: "kind",
    label: "Tipo",
    type: "select",
    options: [
      { value: "produto", label: "Produto" },
      { value: "servico", label: "Serviço" },
    ],
  },
  {
    name: "price",
    label: "Preço de venda",
    type: "money",
    required: true,
    hint: "Esse é o preço que aparece sozinho na tela de Vendas — pode ser ajustado ali se precisar dar desconto numa venda específica.",
  },
  {
    name: "cost",
    label: "Custo (opcional)",
    type: "money",
    hint: "Só pra você acompanhar sua margem — não aparece pro cliente nem entra nos relatórios de venda.",
  },
  { name: "category", label: "Categoria" },
  {
    name: "active",
    label: "Ativo",
    type: "switch",
    hint: "Desligue quando parar de vender esse item. Ele some da lista de Vendas, mas o histórico de vendas antigas continua intacto — diferente de excluir.",
  },
];

function Produtos() {
  const { data, isLoading, isError, refetch } = useList("products", "name", true);
  const save = useSaveRow("products");
  const remove = useDeleteRow("products");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row<"products"> | null>(null);

  return (
    <div>
      <PageHeader
        title="Produtos e serviços"
        subtitle="O que você vende."
        action={
          <Button
            variant="acao"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Novo item
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="Nenhum produto ou serviço cadastrado ainda." />
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((item) => (
            <RecordCard
              key={item.id}
              title={item.name}
              subtitle={`${item.kind === "servico" ? "Serviço" : "Produto"}${item.category ? ` · ${item.category}` : ""
                }${item.cost != null ? ` · custo ${formatMoney(item.cost)}` : ""}${item.active ? "" : " · inativo"
                }`}
              amount={item.price}
              onEdit={() => {
                setEditing(item);
                setOpen(true);
              }}
              onDelete={() =>
                remove.mutate(item.id, { onSuccess: () => toast.success("Item excluído.") })
              }
            />
          ))}
        </ul>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar item" : "Novo produto ou serviço"}
        fields={FIELDS}
        initial={editing ? ({ ...editing } as any) : { kind: "produto", active: true }}
        onSubmit={async (values) => {
          await save.mutateAsync(values);
          toast.success("Item salvo.");
        }}
      />
    </div>
  );
}