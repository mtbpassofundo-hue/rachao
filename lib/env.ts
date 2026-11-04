/**
 * Variáveis de ambiente do site. Falhar cedo, com nome da variável, é melhor
 * do que um erro de "undefined" no meio de um insert.
 */

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor || valor.trim() === "") {
    throw new Error(
      `Variável de ambiente ${nome} não configurada. Veja o .env.example.`,
    );
  }
  return valor.trim();
}

export function urlSupabase(): string {
  return obrigatoria("NEXT_PUBLIC_SUPABASE_URL");
}

export function chaveServicoSupabase(): string {
  return obrigatoria("SUPABASE_SERVICE_ROLE_KEY");
}

export function senhaPainel(): string {
  return obrigatoria("SENHA_PAINEL");
}

export function segredoSessao(): string {
  const segredo = obrigatoria("SESSAO_SEGREDO");
  if (segredo.length < 32) {
    throw new Error("SESSAO_SEGREDO precisa ter pelo menos 32 caracteres.");
  }
  return segredo;
}
