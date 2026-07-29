import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      // Sem isso, o React Query "pausa" a mutação quando o navegador está
      // offline e a tela fica presa em "Salvando…" para sempre. Deixamos a
      // mutação rodar para que nosso tempo-limite mostre o erro amigável.
      mutations: { networkMode: "always" },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
