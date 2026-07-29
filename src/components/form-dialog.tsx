/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "money" | "date" | "select" | "textarea" | "switch";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  onSubmit,
  submitLabel = "Salvar",
  extra,
  onFieldChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  fields: Field[];
  initial?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  submitLabel?: string;
  extra?: ReactNode;
  onFieldChange?: (
    name: string,
    value: any,
    setValues: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  ) => void;
}) {
  const [values, setValues] = useState<Record<string, any>>(initial ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValues(initial ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (name: string, value: any) => {
    setValues((v) => ({ ...v, [name]: value }));
    onFieldChange?.(name, value, setValues);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const parsed: Record<string, any> = { ...values };
      for (const field of fields) {
        if (field.type === "number" || field.type === "money") {
          const raw = parsed[field.name];
          parsed[field.name] = raw === "" || raw == null ? null : Number(raw);
        }
        if (field.type === "switch") parsed[field.name] = Boolean(parsed[field.name]);
      }
      await onSubmit(parsed);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "select" ? (
                <Select
                  value={values[field.name] ?? ""}
                  onValueChange={(v) => set(field.name, v)}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder={field.placeholder ?? "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  value={values[field.name] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.name, e.target.value)}
                />
              ) : field.type === "switch" ? (
                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    id={field.name}
                    checked={Boolean(values[field.name])}
                    onCheckedChange={(v) => set(field.name, v)}
                  />
                  <span className="text-sm text-muted-foreground">{field.hint}</span>
                </div>
              ) : (
                <Input
                  id={field.name}
                  type={
                    field.type === "money" || field.type === "number"
                      ? "number"
                      : field.type === "date"
                        ? "date"
                        : "text"
                  }
                  step={field.type === "money" ? "0.01" : undefined}
                  inputMode={field.type === "money" ? "decimal" : undefined}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(e) => set(field.name, e.target.value)}
                  className={field.type === "money" ? "valor" : undefined}
                />
              )}
              {field.hint && field.type !== "switch" ? (
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              ) : null}
            </div>
          ))}
          {extra}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}