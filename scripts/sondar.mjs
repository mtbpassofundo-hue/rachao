/**
 * Pergunta ao banco se a tabela das inscrições já existe, em vez de supor.
 * Roda com as mesmas variáveis do site.
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Yuri/RACHAO/.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/inscricoes_rachao?select=id&limit=1`;
const resposta = await fetch(url, {
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  },
});

const corpo = await resposta.text();
console.log("HTTP", resposta.status);
console.log(corpo.slice(0, 400));

if (resposta.ok) {
  const linhas = JSON.parse(corpo);
  console.log(`\nA tabela existe. Linhas na amostra: ${linhas.length}`);
} else {
  console.log("\nA tabela ainda NÃO existe — rode supabase/schema.sql.");
}
