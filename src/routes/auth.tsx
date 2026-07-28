import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Caixa Simples" },
      {
        name: "description",
        content: "Acesse o Caixa Simples ou crie sua conta e cadastre seu negócio em um passo.",
      },
      { property: "og:title", content: "Entrar — Caixa Simples" },
      { property: "og:description", content: "Acesse o controle de caixa do seu negócio." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/painel", replace: true });
  }, [session, navigate]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    navigate({ to: "/painel", replace: true });
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("full_name"));
    const companyName = String(form.get("company_name"));
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, company_name: companyName },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(
        error.message.includes("already")
          ? "Esse e-mail já tem conta. Faça login."
          : "Não foi possível criar sua conta agora.",
      );
      return;
    }

    if (!data.session) {
      setLoading(false);
      toast.success("Conta criada. Confirme seu e-mail para entrar.");
      return;
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({ name: companyName, owner_id: data.session.user.id })
      .select("id")
      .single();

    if (companyError || !company) {
      setLoading(false);
      toast.error("Conta criada, mas não conseguimos salvar seu negócio. Tente novamente.");
      return;
    }

    await supabase.from("profiles").insert({
      id: data.session.user.id,
      company_id: company.id,
      full_name: fullName,
      email: data.session.user.email,
    });

    setLoading(false);
    navigate({ to: "/painel", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-capa px-4 py-10 text-capa-foreground">
      <Link to="/" className="mx-auto font-display text-lg">
        Caixa Simples
      </Link>

      <div className="mx-auto mt-8 w-full max-w-md rounded-2xl bg-papel p-6 text-foreground shadow-capa">
        <Tabs defaultValue="entrar">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entrar">Entrar</TabsTrigger>
            <TabsTrigger value="criar">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="entrar" className="mt-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">E-mail</Label>
                <Input id="login-email" name="email" type="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Senha</Label>
                <Input id="login-password" name="password" type="password" required />
              </div>
              <Button type="submit" variant="acao" className="w-full" disabled={loading}>
                Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="criar" className="mt-5">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Seu nome</Label>
                <Input id="signup-name" name="full_name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-company">Nome do seu negócio</Label>
                <Input id="signup-company" name="company_name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input id="signup-email" name="email" type="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" variant="acao" className="w-full" disabled={loading}>
                Criar conta e começar
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}