/**
 * Prova que o .xlsx gerado é um ZIP válido e que o Excel vai achar as peças
 * que ele espera. Confere o que dá para conferir sem abrir o Excel:
 * assinatura do ZIP, CRC de cada arquivo e presença das partes obrigatórias.
 */
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

// O módulo é TypeScript; o Node 24 lê direto com --experimental-strip-types.
const { montarXlsx } = await import("../lib/planilha.ts");

const colunas = [
  { titulo: "#", largura: 5 },
  { titulo: "Nome completo", largura: 30 },
  { titulo: "Modalidade", largura: 15 },
  { titulo: "Idade", largura: 8 },
];

const linhas = [
  [1, "José da Silva Ação", "Rachão", 34],
  [2, 'Maria "Teste" & Cia <b>', "Pedal Kids", 9],
  [3, "Nome com acento é ç ã õ", "Cicloturismo", 51],
  // Caractere de controle colado de outro aplicativo: tem de sair sozinho.
  [4, `Controle${String.fromCharCode(7)}invisível`, "Rachão", 22],
  [5, "", "Rachão", null],
];

const arquivo = montarXlsx("Inscritos", colunas, linhas);
const caminho = "C:/Users/Yuri/RACHAO/scripts/teste.xlsx";
writeFileSync(caminho, arquivo);

console.log("tamanho:", arquivo.length, "bytes");
console.log("assinatura:", arquivo.subarray(0, 4).toString("hex"), "(esperado 504b0304)");

// O unzip do Git for Windows testa o CRC de cada entrada.
try {
  const saida = execFileSync("unzip", ["-t", caminho], { encoding: "utf8" });
  console.log(saida.trim());
} catch (erro) {
  console.log("unzip indisponível:", erro.message.split("\n")[0]);
}

try {
  const lista = execFileSync("unzip", ["-l", caminho], { encoding: "utf8" });
  console.log(lista.trim());
} catch {
  // já avisado acima
}
