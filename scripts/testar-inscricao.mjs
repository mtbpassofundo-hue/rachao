/**
 * Prova de ponta a ponta contra o banco de verdade: preenche o formulário no
 * navegador, confere que gravou, que a lista pública mostra, que o painel
 * entra e que o relatório baixa um .xlsx legível — e apaga tudo no fim.
 *
 * Os CPF são fictícios, mas com dígito verificador certo (senão a validação
 * recusa antes de chegar ao banco). A limpeza roda mesmo se um passo falhar.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const exigir = createRequire("file:///C:/Users/Yuri/MTBPF/package.json");
const puppeteer = exigir("puppeteer-core");

const BASE = process.env.BASE ?? "http://localhost:3300";
const SAIDA = "C:/Users/Yuri/RACHAO/scripts";

const env = Object.fromEntries(
  readFileSync("C:/Users/Yuri/RACHAO/.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const REST = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/inscricoes_rachao`;
const CABECALHOS = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

/** Completa os dois dígitos verificadores de uma base de nove dígitos. */
function cpfComDigitos(base) {
  const calcular = (digitos) => {
    let soma = 0;
    for (let i = 0; i < digitos.length; i++) {
      soma += Number(digitos[i]) * (digitos.length + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = calcular(base);
  const d2 = calcular(base + d1);
  return `${base}${d1}${d2}`;
}

// Base 999.888.7xx: inexistente na Receita, mas com dígito válido.
const CPF_ADULTO = cpfComDigitos("999888777");
const CPF_CRIANCA = cpfComDigitos("999888666");
const CPF_RESPONSAVEL = cpfComDigitos("999888555");
const MARCA = "ZZTESTE";

// Cada execução finge vir de um IP novo: o site tem freio por IP e, rodando
// o teste várias vezes seguidas, ele barrava o próprio teste — falha que
// parecia bug do formulário e era o limitador fazendo o trabalho dele.
const IP_TESTE = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;

let falhas = 0;
function conferir(nome, condicao, detalhe = "") {
  if (!condicao) falhas++;
  console.log(`  ${condicao ? "ok  " : "FALHA"} ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
}

/**
 * Espera um texto aparecer e, se não aparecer, mostra o que a tela estava
 * dizendo. Esperar no escuro só informa que deu errado, não o quê.
 */
async function esperarTexto(pagina, trecho, segundos = 60) {
  // textContent e não innerText: no Chrome headless o innerText só devolve o
  // que entrou em layout — nesta página, 4 mil dos 41 mil caracteres. A
  // confirmação existia e o teste jurava que não.
  try {
    await pagina.waitForFunction(
      (t) => document.body.textContent.includes(t),
      { timeout: segundos * 1000 },
      trecho,
    );
    return true;
  } catch {
    // O que interessa quando um envio não passa são as mensagens de erro e o
    // que estava em cada campo, não a página inteira.
    const estado = await pagina.evaluate(() => ({
      botao: document.querySelector('button[type="submit"]')?.textContent ?? "—",
      erros: [
        ...document.querySelectorAll("p.text-alerta, [role='alert']"),
      ].map((e) => e.textContent.trim()),
      campos: Object.fromEntries(
        [...document.querySelectorAll("input")]
          .filter((c) => c.name)
          .map((c) => [
            c.name + (c.type === "radio" ? `=${c.value}` : ""),
            c.type === "checkbox" || c.type === "radio" ? c.checked : c.value,
          ]),
      ),
    }));
    console.log(`  (esperava "${trecho}" e não veio; botão: "${estado.botao}")`);
    console.log(`  erros na tela: ${JSON.stringify(estado.erros)}`);
    console.log(`  campos: ${JSON.stringify(estado.campos)}`);
    return false;
  }
}

async function limpar() {
  const resposta = await fetch(`${REST}?nome=like.*${MARCA}*`, {
    method: "DELETE",
    headers: { ...CABECALHOS, Prefer: "return=representation" },
  });
  const apagados = await resposta.json();
  console.log(`\nlimpeza: ${Array.isArray(apagados) ? apagados.length : "?"} linha(s) de teste apagada(s)`);
}

async function novaPagina() {
  const pagina = await navegador.newPage();
  await pagina.setExtraHTTPHeaders({ "x-forwarded-for": IP_TESTE });
  return pagina;
}

const navegador = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--no-sandbox"],
});

try {
  await limpar(); // caso tenha sobrado de uma execução anterior

  // ─── Inscrição de adulto no Rachão ─────────────────────────────────────
  console.log("\n== inscrição adulto (Rachão) ==");
  {
    const pagina = await novaPagina();
    await pagina.setViewport({ width: 420, height: 900 });
    await pagina.goto(`${BASE}/#inscricao`, { waitUntil: "networkidle2" });

    await pagina.evaluate(() =>
      document.querySelector('input[value="rachao"]').click(),
    );
    await pagina.type('input[name="nome"]', `Adulto ${MARCA} Silva`);
    await pagina.type('input[name="cpf"]', CPF_ADULTO);
    await pagina.evaluate(() => {
      const campo = document.querySelector('input[name="nascimento"]');
      const setar = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      ).set;
      setar.call(campo, "1988-03-14");
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await pagina.type('input[name="cidade"]', "Passo Fundo");
    await pagina.type('input[name="whatsapp"]', "54988112233");
    await pagina.evaluate(() =>
      document.querySelector('input[value="gigante-bike"]').click(),
    );
    await pagina.evaluate(() =>
      document.querySelector('input[name="confirmacao"]').click(),
    );
    await pagina.evaluate(() =>
      document.querySelector('button[type="submit"]').click(),
    );

    const apareceu = await esperarTexto(pagina, "Inscrição feita");
    conferir("tela de confirmação apareceu", apareceu);
    const texto = await pagina.evaluate(() => document.body.textContent);
    conferir("mostra a modalidade", texto.includes("Rachão"));
    conferir(
      "mostra o ponto escolhido",
      texto.includes("Gigante Bike"),
      texto.includes("Gigante Bike") ? "" : "ponto não apareceu",
    );
    await pagina.close();
  }

  // ─── Inscrição de criança no Pedal Kids ────────────────────────────────
  console.log("\n== inscrição criança (Pedal Kids) ==");
  {
    const pagina = await novaPagina();
    await pagina.setViewport({ width: 420, height: 900 });
    await pagina.goto(`${BASE}/#inscricao`, { waitUntil: "networkidle2" });

    await pagina.evaluate(() =>
      document.querySelector('input[value="pedal-kids"]').click(),
    );
    await pagina.type('input[name="nome"]', `Crianca ${MARCA} Souza`);
    await pagina.type('input[name="cpf"]', CPF_CRIANCA);
    await pagina.evaluate(() => {
      const campo = document.querySelector('input[name="nascimento"]');
      const setar = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      ).set;
      setar.call(campo, "2017-07-02");
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await pagina.type('input[name="cidade"]', "Marau");
    await pagina.type('input[name="whatsapp"]', "54999887766");

    // Tenta enviar SEM o responsável: tem de ser recusado.
    await pagina.evaluate(() =>
      document.querySelector('input[value="sede-campestre"]').click(),
    );
    await pagina.evaluate(() =>
      document.querySelector('input[name="confirmacao"]').click(),
    );
    await pagina.evaluate(() =>
      document.querySelector('button[type="submit"]').click(),
    );
    await pagina.waitForFunction(
      () => document.querySelector(String.raw`[role="alert"]`) !== null,
      { timeout: 60000 },
    );
    const recusa = await pagina.evaluate(() => document.body.textContent);
    conferir(
      "recusa criança sem responsável",
      recusa.includes("responsável") || recusa.includes("termo"),
    );

    // Agora com responsável e termo aceito.
    await pagina.type('input[name="responsavelNome"]', `Mae ${MARCA} Souza`);
    await pagina.type('input[name="responsavelCpf"]', CPF_RESPONSAVEL);
    await pagina.evaluate(() =>
      document.querySelector('input[name="termo"]').click(),
    );
    // Espera o React assumir a marcação antes de enviar: clicar e submeter no
    // mesmo fôlego às vezes mandava o formulário sem o termo.
    await pagina.waitForFunction(
      () => document.querySelector(String.raw`input[name="termo"]`)?.checked === true,
      { timeout: 10000 },
    );
    await pagina.evaluate(() =>
      document.querySelector('button[type="submit"]').click(),
    );
    conferir("aceita com responsável e termo", await esperarTexto(pagina, "Inscrição feita"));
    await pagina.close();
  }

  // ─── CPF repetido ──────────────────────────────────────────────────────
  console.log("\n== CPF repetido ==");
  {
    const resposta = await fetch(REST, {
      method: "POST",
      headers: CABECALHOS,
      body: JSON.stringify({
        nome: `Repetido ${MARCA}`,
        categoria: "rachao",
        cpf: CPF_ADULTO,
        nascimento: "1988-03-14",
        cidade: "Passo Fundo",
        whatsapp: "54988112233",
        ponto_coleta: "bike-tour",
      }),
    });
    const corpo = await resposta.json();
    conferir(
      "o banco recusa o mesmo CPF duas vezes",
      resposta.status === 409 && corpo.code === "23505",
      `HTTP ${resposta.status} ${corpo.code ?? ""}`,
    );
  }

  // ─── Criança sem responsável, escrita direto no banco ──────────────────
  console.log("\n== trava do banco (fora do formulário) ==");
  {
    const resposta = await fetch(REST, {
      method: "POST",
      headers: CABECALHOS,
      body: JSON.stringify({
        nome: `Burla ${MARCA}`,
        categoria: "pedal-kids",
        cpf: cpfComDigitos("999888444"),
        nascimento: "2018-01-01",
        cidade: "Passo Fundo",
        whatsapp: "54991112233",
        ponto_coleta: "bike-tour",
      }),
    });
    const corpo = await resposta.json();
    conferir(
      "recusa Pedal Kids sem responsável mesmo por fora",
      resposta.status >= 400 && String(corpo.message ?? "").includes("responsavel_no_pedal_kids"),
      `HTTP ${resposta.status}`,
    );
  }

  // ─── Lista pública ─────────────────────────────────────────────────────
  console.log("\n== lista pública ==");
  {
    const pagina = await novaPagina();
    await pagina.setViewport({ width: 1366, height: 900 });
    await pagina.goto(`${BASE}/inscritos`, { waitUntil: "networkidle2" });
    const texto = await pagina.evaluate(() => document.body.textContent);
    conferir("mostra o adulto", texto.includes(`Adulto ${MARCA} Silva`));
    conferir("mostra a criança", texto.includes(`Crianca ${MARCA} Souza`));
    conferir("NÃO mostra CPF", !texto.includes(CPF_ADULTO.slice(0, 3) + "."));
    conferir("NÃO mostra WhatsApp", !texto.includes("98811-2233"));
    conferir("NÃO mostra cidade", !texto.includes("Marau"));

    const html = await pagina.content();
    conferir(
      "o CPF nem vai no HTML",
      !html.includes(CPF_ADULTO) && !html.includes(CPF_CRIANCA),
    );
    await pagina.close();
  }

  // ─── Painel e relatório ────────────────────────────────────────────────
  console.log("\n== painel e relatório ==");
  {
    const pagina = await novaPagina();
    await pagina.setViewport({ width: 1440, height: 900 });
    await pagina.goto(`${BASE}/painel`, { waitUntil: "networkidle2" });
    await pagina.type("#senha", env.SENHA_PAINEL);
    await pagina.evaluate(() =>
      document.querySelector('button[type="submit"]').click(),
    );
    await esperarTexto(pagina, "Baixar Excel");
    const texto = await pagina.evaluate(() => document.body.textContent);
    conferir("painel abriu com a senha", texto.includes("Baixar Excel"));
    conferir("mostra o responsável da criança", texto.includes(`Mae ${MARCA} Souza`));
    conferir("mostra o CPF para a organização", texto.includes("999.888.777"));
    conferir("painel mostra o WhatsApp", texto.includes("98811-2233"));

    // Marca o brinquedo como entregue e confere que gravou.
    await pagina.evaluate(() => {
      const linha = [...document.querySelectorAll("tbody tr")].find((l) =>
        l.innerText.includes("ZZTESTE"),
      );
      linha.querySelector('input[type="checkbox"]').click();
    });
    await new Promise((r) => setTimeout(r, 2500));
    const marcados = await fetch(
      `${REST}?nome=like.*${MARCA}*&brinquedo_entregue=eq.true&select=nome`,
      { headers: CABECALHOS },
    ).then((r) => r.json());
    conferir(
      "marcar brinquedo grava no banco",
      Array.isArray(marcados) && marcados.length === 1,
      `${marcados.length ?? 0} marcado(s)`,
    );

    // Baixa o relatório com o cookie da sessão.
    const cookies = await pagina.cookies();
    const cookie = cookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    const relatorio = await fetch(`${BASE}/painel/relatorio`, {
      headers: { cookie },
    });
    const bytes = Buffer.from(await relatorio.arrayBuffer());
    const caminho = `${SAIDA}/relatorio-teste.xlsx`;
    writeFileSync(caminho, bytes);
    conferir(
      "relatório responde 200",
      relatorio.status === 200,
      `HTTP ${relatorio.status}`,
    );
    conferir(
      "é mesmo um xlsx",
      bytes.subarray(0, 4).toString("hex") === "504b0304",
      `${(bytes.length / 1024).toFixed(1)} KB`,
    );
    conferir(
      "o nome do arquivo vem certo",
      (relatorio.headers.get("content-disposition") ?? "").includes(".xlsx"),
    );
    try {
      execFileSync("unzip", ["-t", caminho], { encoding: "utf8" });
      conferir("o arquivo abre sem erro de CRC", true);
    } catch (erro) {
      conferir("o arquivo abre sem erro de CRC", false, erro.message.slice(0, 60));
    }
    const planilha = execFileSync(
      "unzip",
      ["-p", caminho, "xl/worksheets/sheet1.xml"],
      { encoding: "utf8" },
    );
    conferir("o relatório traz o adulto", planilha.includes(`Adulto ${MARCA} Silva`));
    conferir("o relatório traz a criança", planilha.includes(`Crianca ${MARCA} Souza`));
    conferir("o relatório traz o responsável", planilha.includes(`Mae ${MARCA} Souza`));
    await pagina.close();
  }
} finally {
  await limpar();
  await navegador.close();
}

console.log(falhas === 0 ? "\nTudo certo." : `\n${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
