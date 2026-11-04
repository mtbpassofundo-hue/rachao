/**
 * Monta o .env.local do Rachão a partir do que já está configurado no MTBPF.
 *
 * Os dois sites usam o mesmo projeto Supabase, então URL e chave de serviço
 * são copiadas de lá. A senha do painel e o segredo da sessão são novos — o
 * painel do Rachão não é o mesmo painel, e cookie assinado com segredo
 * compartilhado valeria nos dois.
 *
 * Imprime só a senha do painel; a chave do Supabase nunca aparece na tela.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ORIGEM = "C:/Users/Yuri/MTBPF/.env.local";
const DESTINO = "C:/Users/Yuri/RACHAO/.env.local";

if (existsSync(DESTINO)) {
  console.log(".env.local já existe — nada foi tocado.");
  process.exit(0);
}

const lido = readFileSync(ORIGEM, "utf8");
const valor = (nome) => {
  const linha = lido
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${nome}=`) && !l.trimStart().startsWith("#"));
  if (!linha) throw new Error(`${nome} não encontrada em ${ORIGEM}`);
  return linha.slice(nome.length + 1).trim();
};

// Senha pronunciável de propósito: quem vai usar é a diretoria do clube, no
// celular, no dia da prova. Quatro dígitos aleatórios no fim para não ser
// adivinhável.
const senha = `brinquedo-rachao-${randomBytes(2).readUInt16BE(0) % 10000}`;

writeFileSync(
  DESTINO,
  [
    "# Mesmo projeto Supabase do site do MTB Passo Fundo, tabela separada.",
    `NEXT_PUBLIC_SUPABASE_URL=${valor("NEXT_PUBLIC_SUPABASE_URL")}`,
    `SUPABASE_SERVICE_ROLE_KEY=${valor("SUPABASE_SERVICE_ROLE_KEY")}`,
    "",
    "# Painel da organização, em /painel.",
    `SENHA_PAINEL=${senha}`,
    `SESSAO_SEGREDO=${randomBytes(32).toString("hex")}`,
    "",
  ].join("\n"),
  "utf8",
);

console.log("gravado .env.local");
console.log("SENHA_PAINEL =", senha);
