import { useEffect, useState } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { OFFLINE_MESSAGE, useCompany, withTimeout } from "@/lib/data";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const { data: profile, isLoading: loadingProfile } = useCompany();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session || loadingProfile) return <LoadingState />;
  if (!profile) return <Onboarding />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function Onboarding() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const meta = (session?.user.user_metadata ?? {}) as {
    full_name?: string;
    company_name?: string;
  };
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await withTimeout(async () => {
        // Reaproveita a empresa já criada no cadastro, se existir — evita
        // empresa duplicada quando esta tela aparece por engano.
        const { data: existing } = await supabase
          .from("companies")
          .select("id")
          .eq("owner_id", session.user.id)
          .limit(1)
          .maybeSingle();

        let companyId = existing?.id;
        if (!companyId) {
          const { data: company, error } = await supabase
            .from("companies")
            .insert({ name: String(form.get("company_name")), owner_id: session.user.id })
            .select("id")
            .single();
          if (error) throw error;
          companyId = company.id;
        }

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: session.user.id,
          company_id: companyId,
          full_name: String(form.get("full_name")),
          email: session.user.email,
        });
        if (profileError) throw profileError;
      });
      await queryClient.invalidateQueries();
    } catch (error) {
      const offline = error instanceof Error && error.message === OFFLINE_MESSAGE;
      toast.error(
        offline ? OFFLINE_MESSAGE : "Não foi possível salvar agora. Tente novamente em instantes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-capa px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-papel p-6 text-foreground shadow-capa"
      >
        <h1 className="font-display text-xl">Vamos cadastrar seu negócio</h1>
        <p className="text-sm text-muted-foreground">
          Só precisamos disso uma vez para separar os seus dados.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="onb-name">Seu nome</Label>
          <Input id="onb-name" name="full_name" defaultValue={meta.full_name ?? ""} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onb-company">Nome do negócio</Label>
          <Input
            id="onb-company"
            name="company_name"
            defaultValue={meta.company_name ?? ""}
            required
          />
        </div>
        <Button type="submit" variant="acao" className="w-full" disabled={saving}>
          Começar
        </Button>
      </form>
    </div>
  );
}