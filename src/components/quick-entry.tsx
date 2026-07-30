/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useSaveRow } from "@/lib/data";
import { today } from "@/lib/format";
import { FormDialog, type Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";

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
];

/** Botão fixo de ação rápida: registra um lançamento no caixa de qualquer tela. */
export function QuickEntryFab() {
  const [open, setOpen] = useState(false);
  const save = useSaveRow("transactions");

  return (
    <>
      <Button
        variant="acao"
        size="icon"
        aria-label="Novo lançamento rápido"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full shadow-capa transition-transform duration-200 hover:scale-105"
      >
        <Plus className="size-6" />
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Novo lançamento"
        description="Registro rápido de entrada ou saída no caixa."
        fields={FIELDS}
        initial={{ kind: "saida", occurred_on: today(), payment_method: "Dinheiro" } as any}
        onSubmit={async (values) => {
          await save.mutateAsync(values);
          toast.success("Lançamento salvo.");
        }}
      />
    </>
  );
}