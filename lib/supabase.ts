import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { chaveServicoSupabase, urlSupabase } from "@/lib/env";

/**
 * Cliente com a chave de serviço — ignora RLS e por isso NUNCA pode ser
 * importado por um componente cliente. Só Server Actions e componentes de
 * servidor tocam neste arquivo.
 *
 * A tabela `inscricoes_rachao` está com RLS ligado e sem nenhuma policy, então
 * a chave anônima não enxerga nada mesmo que vaze no navegador. É o que
 * guarda o CPF de quem se inscreve.
 */
let cliente: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!cliente) {
    cliente = createClient(urlSupabase(), chaveServicoSupabase(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cliente;
}

export type Inscricao = {
  id: string;
  criado_em: string;
  nome: string;
  categoria: string;
  cpf: string;
  nascimento: string;
  cidade: string;
  whatsapp: string;
  ponto_coleta: string;
  /** Só preenchidos quando a categoria é o Pedal Kids. */
  responsavel_nome: string | null;
  responsavel_cpf: string | null;
  /** Momento em que o responsável aceitou o termo. */
  termo_aceito_em: string | null;
  /** Marcado à mão no painel quando o brinquedo chega ao ponto de coleta. */
  brinquedo_entregue: boolean;
};

/** O que a lista pública mostra — nome e modalidade, nada mais. */
export type InscritoPublico = Pick<Inscricao, "nome" | "categoria" | "criado_em">;
