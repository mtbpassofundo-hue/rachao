/**
 * Cadastra na Vercel as quatro variáveis que o site precisa, lendo do
 * .env.local.
 *
 * Os valores vão pela entrada padrão do comando, nunca como argumento: o que
 * é argumento aparece na lista de processos e no histórico do terminal, e um
 * deles é a chave de serviço do banco.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PRECISAM = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SENHA_PAINEL",
  "SESSAO_SEGREDO",
];

const AMBIENTES = ["production", "preview", "development"];

const env = Object.fromEntries(
  readFileSync("C:/Users/Yuri/RACHAO/.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

for (const nome of PRECISAM) {
  const valor = env[nome];
  if (!valor) {
    console.log(`${nome}: FALTA no .env.local — pulei`);
    continue;
  }
  for (const ambiente of AMBIENTES) {
    const r = spawnSync(
      "npx",
      ["vercel", "env", "add", nome, ambiente],
      { input: valor, encoding: "utf8", shell: true },
    );
    const saida = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    const jaExiste = saida.includes("already exists");
    console.log(
      `${nome} [${ambiente}]: ${r.status === 0 ? "ok" : jaExiste ? "já existia" : "FALHOU"}`,
    );
    if (r.status !== 0 && !jaExiste) {
      console.log(`  ${saida.trim().split("\n").slice(-3).join(" | ")}`);
    }
  }
}
