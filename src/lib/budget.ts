import { monthRange } from "@/lib/format";

/** Primeiro dia do mês, no formato aceito pelo banco (date). */
export function monthRef(ref = new Date()) {
  return monthRange(ref).start;
}

export function budgetTone(pct: number) {
  if (pct >= 100) return { bar: "bg-saida", text: "text-saida" };
  if (pct >= 80) return { bar: "bg-acao", text: "text-acao" };
  return { bar: "bg-entrada", text: "text-entrada" };
}

export type BudgetProgress = {
  id?: string;
  category: string;
  limit: number;
  spent: number;
  pct: number;
};

/** Cruza orçamentos com as saídas do período e devolve o progresso de cada categoria. */
export function buildProgress(
  budgets: { id: string; category: string; limit_amount: number | string }[],
  saidas: { category: string | null; amount: number | string }[],
): BudgetProgress[] {
  const gasto = new Map<string, number>();
  for (const t of saidas) {
    const key = (t.category?.trim() || "Sem categoria").toLowerCase();
    gasto.set(key, (gasto.get(key) ?? 0) + Number(t.amount));
  }
  return budgets.map((b) => {
    const limit = Number(b.limit_amount);
    const spent = gasto.get(b.category.trim().toLowerCase()) ?? 0;
    return {
      id: b.id,
      category: b.category,
      limit,
      spent,
      pct: limit > 0 ? (spent / limit) * 100 : 0,
    };
  });
}