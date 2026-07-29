import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatusTag({ status }: { status: string }) {
  const pago = status === "paga" || status === "recebido" || status === "pago";
  return (
    <span
      className={cn(
        "valor rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide",
        pago ? "bg-entrada-soft text-entrada" : "bg-accent text-accent-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function RecordCard({
  title,
  subtitle,
  meta,
  amount,
  tone = "neutro",
  badge,
  actions,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  amount?: number | string | null;
  tone?: "entrada" | "saida" | "neutro";
  badge?: ReactNode;
  actions?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <li className="animate-in fade-in slide-in-from-bottom-1 rounded-xl border border-border bg-card p-4 shadow-livro transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium leading-tight">{title}</p>
          {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
          {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {amount != null ? (
          <p
            className={cn(
              "valor shrink-0 text-right text-base font-semibold",
              tone === "entrada" && "text-entrada",
              tone === "saida" && "text-saida",
            )}
          >
            {tone === "saida" ? "− " : tone === "entrada" ? "+ " : ""}
            {formatMoney(amount)}
          </p>
        ) : null}
      </div>
      {(actions || onEdit || onDelete || badge) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {badge}
          {actions}
          {onEdit ? (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil /> Editar
            </Button>
          ) : null}
          {onDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-saida">
                  <Trash2 /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir "{title}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Essa ação não pode ser desfeita. Se esse registro já tiver gerado um
                    lançamento no Caixa, ele também será removido.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-saida hover:bg-saida/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      )}
    </li>
  );
}