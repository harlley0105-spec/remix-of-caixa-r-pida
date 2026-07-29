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

export const Route = createFileRoute("/_app/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas — Caixa Simples" },
      {
        name: "description",
        content: "Cadastre vendas e gere o lançamento no caixa ao marcar como paga.",
      },
      { property: "og:title", content: "Vendas — Caixa Simples" },
      { property: "og:description", content: "Controle das vendas do seu negócio." },
    ],
  }),
  component: Vendas,
});

function Vendas() {
  const { data, isLoading, isError, refetch } = useList("sales", "sold_on");
  const clients = useList("clients", "name", true);
  const products = useList("products", "name", true);
  const { data: profile } = useCompany();
  const save = useSaveRow("sales");
  const remove = useDeleteRow("sales");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row<"sales"> | null>(null);

  const fields: Field[] = [
    {
      name: "client_name",
      label: "Cliente",
      type: "select",
      options: [
        { value: "Consumidor", label: "Consumidor (sem cadastro)" },
        ...(clients.data ?? []).map((c) => ({ value: c.name, label: c.name })),
      ],
      hint: "Escolha \"Consumidor\" se for uma venda avulsa, sem precisar cadastrar a pessoa.",
    },
    {
      name: "product_name",
      label: "Produto ou serviço",
      type: "select",
      options: (products.data ?? []).map((p) => ({ value: p.name, label: p.name })),
      hint: "Cadastre em Produtos/serviços para aparecer aqui. O valor unitário abaixo é preenchido sozinho com o preço cadastrado.",
    },
    {
      name: "quantity",
      label: "Quantidade",
      type: "number",
      required: true,
      hint: "Quantas unidades desse produto/serviço nessa venda.",
    },
    {
      name: "unit_amount",
      label: "Valor unitário",
      type: "money",
      required: true,
      hint: "Vem preenchido com o preço cadastrado do produto — mude aqui só se for dar desconto ou cobrar diferente dessa vez.",
    },
    {
      name: "sold_on",
      label: "Data da venda",
      type: "date",
      required: true,
      hint: "Data em que a venda foi feita (pode ser diferente de hoje).",
    },
    {
      name: "payment_method",
      label: "Forma de pagamento",
      type: "select",
      options: ["Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito", "Boleto", "Outro"].map(
        (p) => ({ value: p, label: p }),
      ),
    },
    {
      name: "status",
      label: "Situação",
      type: "select",
      options: [
        { value: "pendente", label: "Ainda não recebi" },
        { value: "paga", label: "Já recebi" },
        { value: "cancelada", label: "Cancelada" },
      ],
      hint: "Se marcar \"Já recebi\", essa venda entra sozinha no Caixa como entrada.",
    },
  ];

  async function marcarPaga(sale: Row<"sales">) {
    if (!profile?.company_id) return;
    try {
      await ensureLedgerEntry({
        companyId: profile.company_id,
        kind: "entrada",
        amount: Number(sale.total_amount),
        occurred_on: sale.sold_on,
        category: "Vendas",
        description: `Venda: ${sale.product_name}${sale.client_name ? ` — ${sale.client_name}` : ""}`,
        payment_method: sale.payment_method,
        sourceType: "sale",
        sourceId: sale.id,
      });
      await supabase.from("sales").update({ status: "paga" }).eq("id", sale.id);
      queryClient.invalidateQueries();
      toast.success("Recebimento registrado.");
    } catch {
      toast.error("Não foi possível registrar agora. Tente novamente em instantes.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Vendas"
        subtitle="Ao marcar como paga, a entrada aparece sozinha no caixa."
        action={
          <Button
            variant="acao"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Nova venda
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="Nenhuma venda registrada ainda." />
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((sale) => (
            <RecordCard
              key={sale.id}
              title={sale.product_name}
              subtitle={`${sale.client_name ?? "Consumidor"} · ${formatDate(sale.sold_on)} · ${Number(
                sale.quantity,
              )}x`}
              amount={sale.total_amount}
              tone={sale.status === "paga" ? "entrada" : "neutro"}
              badge={<StatusTag status={sale.status} />}
              actions={
                sale.status === "pendente" ? (
                  <Button size="sm" variant="entrada" onClick={() => marcarPaga(sale)}>
                    Marcar como paga
                  </Button>
                ) : null
              }
              onEdit={() => {
                setEditing(sale);
                setOpen(true);
              }}
              onDelete={() =>
                remove.mutate(sale.id, { onSuccess: () => toast.success("Venda excluída.") })
              }
            />
          ))}
        </ul>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar venda" : "Nova venda"}
        fields={fields}
        onFieldChange={(name, value, setValues) => {
          if (name === "product_name") {
            const product = (products.data ?? []).find((p) => p.name === value);
            if (product) {
              setValues((v) => ({ ...v, unit_amount: Number(product.price) }));
            }
          }
        }}
        initial={
          editing
            ? ({ ...editing } as any)
            : {
                client_name: "Consumidor",
                quantity: 1,
                sold_on: today(),
                status: "pendente",
                payment_method: "Dinheiro",
              }
        }
    onSubmit={async (values) => {
          const quantity = Number(values.quantity ?? 1);
          const unit = Number(values.unit_amount ?? 0);
          const total = quantity * unit;
          const client = (clients.data ?? []).find((c) => c.name === values.client_name);
          const product = (products.data ?? []).find((p) => p.name === values.product_name);
          const saleId = await save.mutateAsync({
            ...values,
            quantity,
            unit_amount: unit,
            total_amount: total,
            client_id: client?.id ?? null,
            product_id: product?.id ?? null,
          });

          if (values.status === "paga" && profile?.company_id) {
            const { data: existing } = await supabase
              .from("transactions")
              .select("id")
              .eq("source_type", "sale")
              .eq("source_id", saleId)
              .maybeSingle();

            if (existing) {
              // Venda já estava paga e foi editada — atualiza o valor no caixa em vez de duplicar.
              await supabase
                .from("transactions")
                .update({
                  amount: total,
                  occurred_on: values.sold_on,
                  description: `Venda: ${values.product_name}`,
                  payment_method: values.payment_method,
                })
                .eq("id", existing.id);
            } else {
              await ensureLedgerEntry({
                companyId: profile.company_id,
                kind: "entrada",
                amount: total,
                occurred_on: values.sold_on,
                category: "Vendas",
                description: `Venda: ${values.product_name}`,
                payment_method: values.payment_method,
                sourceType: "sale",
                sourceId: saleId,
              });
            }
          } else {
            // Status não é mais "paga" — remove do caixa a entrada que tinha sido criada antes,
            // senão o dinheiro continua contando mesmo a venda estando pendente/cancelada.
            await supabase
              .from("transactions")
              .delete()
              .eq("source_type", "sale")
              .eq("source_id", saleId);
          }

          queryClient.invalidateQueries();
          toast.success("Venda salva.");
        }}
      />
    </div>
  );
}