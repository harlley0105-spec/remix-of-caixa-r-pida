import { formatMoney } from "@/lib/format";
import { budgetTone, type BudgetProgress } from "@/lib/budget";
import { cn } from "@/lib/utils";

export function BudgetBar({ item, compact }: { item: BudgetProgress; compact?: boolean }) {
  const tone = budgetTone(item.pct);
  const restante = item.limit - item.spent;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium">{item.category}</span>
        <span className={cn("valor shrink-0", tone.text)}>
          {formatMoney(item.spent)} / {formatMoney(item.limit)}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-2.5 rounded-full transition-all duration-500", tone.bar)}
          style={{ width: `${Math.min(item.pct, 100)}%` }}
        />
      </div>
      {compact ? null : (
        <p className="mt-1 text-xs text-muted-foreground">
          {item.pct >= 100
            ? `Estourou ${formatMoney(Math.abs(restante))} do limite.`
            : `${Math.round(item.pct)}% usado · restam ${formatMoney(restante)}.`}
        </p>
      )}
    </div>
  );
}