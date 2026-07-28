import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caixa Simples — dinheiro do seu negócio organizado" },
      {
        name: "description",
        content:
          "Veja quanto entrou, quanto saiu, o que vence essa semana e o lucro estimado do mês. Feito para MEI e pequenos negócios.",
      },
      { property: "og:title", content: "Caixa Simples" },
      {
        property: "og:description",
        content: "Entradas, saídas, vendas, cobranças e lembretes em um só lugar.",
      },
    ],
  }),
  component: Capa,
});

const ITENS = [
  { titulo: "Caixa", texto: "Registre entradas e saídas em segundos. O saldo se atualiza sozinho." },
  { titulo: "Vendas", texto: "Marcou como paga? O lançamento no caixa aparece automaticamente." },
  { titulo: "Contas", texto: "A pagar e a receber com vencimento, sem perder prazo." },
  { titulo: "Relatório do mês", texto: "Entradas, saídas, lucro estimado e o que ficou pendente." },
];

function Capa() {
  return (
    <div className="min-h-screen bg-capa text-capa-foreground">
      <div className="mx-auto max-w-3xl px-5 py-14">
        <header className="flex items-center justify-between">
          <span className="font-display text-lg">Caixa Simples</span>
          <Link to="/auth" className="text-sm text-capa-foreground/70 underline-offset-4 hover:underline">
            Entrar
          </Link>
        </header>

        <section className="mt-16">
          <p className="valor text-xs uppercase tracking-[0.25em] text-acao">Livro-caixa moderno</p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
            O dinheiro do seu negócio,
            <br />
            organizado sem complicação.
          </h1>
          <p className="mt-5 max-w-xl text-capa-foreground/70">
            Feito para MEI, lojinhas, salões, marmitarias e prestadores de serviço. Sem termos
            difíceis, sem imposto, sem nota fiscal — só o que você precisa saber sobre o seu caixa.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="acao" size="lg">
              <Link to="/auth">Criar minha conta</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-capa-foreground/25 bg-transparent text-capa-foreground hover:bg-capa-muted hover:text-capa-foreground"
            >
              <Link to="/auth">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        <section className="mt-20 grid gap-3 sm:grid-cols-2">
          {ITENS.map((item) => (
            <article
              key={item.titulo}
              className="rounded-xl border border-capa-foreground/10 bg-capa-muted/60 p-5"
            >
              <h2 className="font-display text-lg text-acao">{item.titulo}</h2>
              <p className="mt-2 text-sm text-capa-foreground/70">{item.texto}</p>
            </article>
          ))}
        </section>

        <footer className="mt-20 text-xs text-capa-foreground/40">
          Os números do Caixa Simples servem para organização interna do seu negócio.
        </footer>
      </div>
    </div>
  );
}
