import type { Metadata } from "next";

import { Login } from "@/app/painel/login";
import { Tabela } from "@/app/painel/tabela";
import { sessaoValida } from "@/lib/sessao";
import { supabaseAdmin, type Inscricao } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default async function PainelPagina() {
  if (!(await sessaoValida())) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <Login />
      </main>
    );
  }

  const { data, error } = await supabaseAdmin()
    .from("inscricoes_rachao")
    .select(
      "id, criado_em, nome, categoria, cpf, nascimento, cidade, whatsapp, ponto_coleta, responsavel_nome, responsavel_cpf, termo_aceito_em, brinquedo_entregue",
    )
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Falha ao ler as inscrições:", error);
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <p className="max-w-md text-center text-neve-300">
          Não foi possível carregar a lista agora. Recarregue a página em alguns
          instantes.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Tabela inscricoes={(data ?? []) as Inscricao[]} />
    </main>
  );
}
