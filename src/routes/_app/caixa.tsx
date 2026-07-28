/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useDeleteRow, useList, useSaveRow, type Row } from "@/lib/data";
import { formatDate, formatMoney, monthRange, today } from "@/lib/format";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RecordCard } from "@/components/record-card";
import { FormDialog, type Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/caixa")({
  head: () => ({
    meta: [
      { title: "Caixa — Caixa Simples" },
      { name: "description", content: "Registre entradas e saídas e acompanhe o saldo do período." },
      { property: "og:title", content: "Caixa — Caixa Simples" },
      { property: "og:description", content: "Entradas, saídas e saldo automático." },
    ],
  }),
  component: Caixa,
});

const PAGAMENTOS = ["Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito", "Boleto", "Outro"];

const FIELDS: Field[] = [
  {
    name: "kind",
    label: "Tipo",
    type: "select",
    options: [
      { value: "entrada", label: "Entrada (dinheiro que chegou)" },
      { value: "saida", label: "Saída (dinheiro que saiu)" },
    ],
  },
  { name: "amount", label: "Valor", type: "money", required: true },
  { name: "occurred_on", label: "Data", type: "date", required: true },
  { name: "category", label: "Categoria", placeholder: "Ex.: vendas, aluguel, insumos" },
  { name: "description", label: "Descrição", required: true },
  {
    name: "payment_method",
    label: "Forma de pagamento",
    type: "select",
    options: PAGAMENTOS.map((p) => ({ value: p, label: p })),
  },
  { name: "notes", label: "Observação", type: "textarea" },
];

function Caixa() {
  const { data, isLoading, isError, refetch } = useList("transactions", "occurred_on");
  const save = useSaveRow("transactions");
  const remove = useDeleteRow("transactions");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row<"transactions"> | null>(null);
  const initialRange = monthRange();
  const [from, setFrom] = useState(initialRange.start);
  const [to, setTo] = useState(initialRange.end);

  const rows = useMemo(
    () => (data ?? []).filter((t) => t.occurred_on >= from && t.occurred_on <= to),
    [data, from, to],
  );
  const saldo = rows.reduce(
    (acc, t) => acc + (t.kind === "entrada" ? Number(t.amount) : -Number(t.amount)),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Caixa"
        subtitle="Tudo que entrou e saiu do seu negócio."
        action={
          <Button
            variant="acao"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Novo lançamento
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="de">De</Label>
          <Input id="de" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ate">Até</Label>
          <Input id="ate" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo do período</p>
          <p className="valor text-xl font-semibold">{formatMoney(saldo)}</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState message="Nenhum lançamento ainda — registre sua primeira entrada ou saída." />
      ) : (
        <ul className="space-y-2">
          {rows.map((t) => (
            <RecordCard
              key={t.id}
              title={t.description || (t.kind === "entrada" ? "Entrada" : "Saída")}
              subtitle={`${formatDate(t.occurred_on)}${t.category ? ` · ${t.category}` : ""}${
                t.payment_method ? ` · ${t.payment_method}` : ""
              }`}
              amount={t.amount}
              tone={t.kind === "entrada" ? "entrada" : "saida"}
              onEdit={
                t.source_id
                  ? undefined
                  : () => {
                      setEditing(t);
                      setOpen(true);
                    }
              }
              onDelete={
                t.source_id
                  ? undefined
                  : () => remove.mutate(t.id, { onSuccess: () => toast.success("Lançamento excluído.") })
              }
            />
          ))}
        </ul>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar lançamento" : "Novo lançamento"}
        fields={FIELDS}
        initial={
          editing
            ? ({ ...editing } as any)
            : { kind: "entrada", occurred_on: today(), payment_method: "Dinheiro" }
        }
        onSubmit={async (values) => {
          await save.mutateAsync(values);
          toast.success("Lançamento salvo.");
        }}
      />
    </div>
  );
}