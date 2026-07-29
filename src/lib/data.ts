/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSession } from "@/lib/session";

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];

export const ERROR_MESSAGE =
  "Não foi possível carregar seus dados agora. Tente novamente em instantes.";

export const OFFLINE_MESSAGE =
  "Sem conexão com a internet. Verifique sua rede e tente de novo — nada foi perdido.";

/**
 * O supabase-js não tem tempo-limite próprio: sem internet a promessa fica
 * pendurada e a tela trava em "Salvando…". Aqui cortamos em 12s e devolvemos
 * uma mensagem amigável.
 */
export async function withTimeout<T>(run: () => Promise<T>, ms = 12000): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error(OFFLINE_MESSAGE);
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(OFFLINE_MESSAGE)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function useCompany() {
  const { session, loading } = useSession();
  const userId = session?.user.id;
  return useQuery({
    // A chave inclui o usuário: sem isso o resultado "null" buscado antes da
    // sessão existir ficava em cache e o onboarding reaparecia após o cadastro.
    queryKey: ["company", userId ?? "anon"],
    enabled: !loading && Boolean(userId),
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
      return withTimeout(async () => {
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
      });
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteRow<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await withTimeout(async () => {
      const { error } = await (supabase.from(table) as any).delete().eq("id", id);
      if (error) throw error;
      });
    },
    onSuccess: () => invalidateAll(qc),
  });
}

/**
 * Como useDeleteRow, mas também remove o lançamento de caixa gerado a partir
 * desse registro (venda paga, conta paga/recebida) — evita "sobrar" saldo
 * no Caixa referente a algo que não existe mais.
 */
export function useDeleteRowWithLedger<T extends TableName>(table: T, sourceType: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await withTimeout(async () => {
      await supabase.from("transactions").delete().eq("source_type", sourceType).eq("source_id", id);
      const { error } = await (supabase.from(table) as any).delete().eq("id", id);
      if (error) throw error;
      });
    },
    onSuccess: () => invalidateAll(qc),
  });
}

/**
 * Atualiza o lançamento de caixa vinculado a um registro (se existir), para
 * manter o valor/data/descrição em dia quando o registro de origem é editado
 * depois de já estar pago/recebido.
 */
export async function syncLedgerEntry(
  sourceType: string,
  sourceId: string,
  patch: { amount: number; occurred_on?: string; description: string; payment_method?: string | null },
) {
  const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .maybeSingle();
  if (!existing) return;
  await supabase
    .from("transactions")
    .update({
      amount: patch.amount,
      ...(patch.occurred_on ? { occurred_on: patch.occurred_on } : {}),
      description: patch.description,
      payment_method: patch.payment_method ?? null,
    })
    .eq("id", existing.id);
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