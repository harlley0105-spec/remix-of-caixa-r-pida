import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
      <p className="mx-auto max-w-sm text-sm text-muted-foreground">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-saida-soft px-6 py-8 text-center">
      <p className="text-sm text-foreground">
        Não foi possível carregar seus dados agora. Tente novamente em instantes.
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Carregando…
    </div>
  );
}