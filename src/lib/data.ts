/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];

export const ERROR_MESSAGE =
  "Não foi possível carregar seus dados agora. Tente novamente em instantes.";

export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, company_id, companies(id, name, segment)")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useList<T extends TableName>(
  table: T,
  orderBy: string,
  ascending = false,
) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await (supabase.from(table) as any)
        .select("*")
        .order(orderBy, { ascending });
      if (error) throw error;
      return (data ?? []) as Row<T>[];
    },
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries();
}

export function useSaveRow<T extends TableName>(table: T) {
  const qc = useQueryClient();
  const { data: profile } = useCompany();
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { id, ...rest } = values;
      if (id) {
        const { error } = await (supabase.from(table) as any).update(rest).eq("id", id);
        if (error) throw error;
        return id as string;
      }
      const { data, error } = await (supabase.from(table) as any)
        .insert({ ...rest, company_id: profile?.company_id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteRow<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from(table) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

type LedgerInput = {
  companyId: string;
  kind: "entrada" | "saida";
  amount: number;
  occurred_on: string;
  category?: string | null;
  description: string;
  payment_method?: string | null;
  sourceType: string;
  sourceId: string;
};

/** Gera o lançamento de caixa a partir de venda/conta, sem duplicar. */
export async function ensureLedgerEntry(input: LedgerInput) {
  const { data: existing, error: findError } = await supabase
    .from("transactions")
    .select("id")
    .eq("source_type", input.sourceType)
    .eq("source_id", input.sourceId)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      company_id: input.companyId,
      kind: input.kind,
      amount: input.amount,
      occurred_on: input.occurred_on,
      category: input.category ?? null,
      description: input.description,
      payment_method: input.payment_method ?? null,
      source_type: input.sourceType,
      source_id: input.sourceId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}