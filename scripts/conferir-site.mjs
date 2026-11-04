/**
 * Roteiro de conferência das telas, no navegador de verdade.
 *
 * Mede o que dá para medir sem o banco: transbordo horizontal no celular,
 * mensagens de validação, e o momento em que o bloco do responsável aparece.
 * Tudo isso roda antes do insert, então não depende do Supabase estar de pé.
 */
import { createRequire } from "node:module";

const exigir = createRequire("file:///C:/Users/Yuri/MTBPF/package.json");
const puppeteer = exigir("puppeteer-core");

const SAIDA =
  "C:/Users/Yuri/AppData/Local/Temp/claude/c--Users-Yuri--gemini-antigravity-scratch-engeterm/1769d7fe-c499-40d1-91c2-3bfae11d0db5/scratchpad";
const BASE = "http://localhost:3210";

const navegador = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--no-sandbox"],
});

let falhas = 0;
function conferir(nome, condicao, detalhe = "") {
  const marca = condicao ? "ok  " : "FALHA";
  if (!condicao) falhas++;
  console.log(`  ${marca} ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
}

// ─── Transbordo em três larguras ──────────────────────────────────────────
console.log("\n== largura das páginas ==");
for (const largura of [360, 390, 768, 1366]) {
  for (const caminho of ["/", "/inscritos", "/painel"]) {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: largura, height: 900 });
    await pagina.goto(BASE + caminho, { waitUntil: "networkidle2" });
    const excesso = await pagina.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    conferir(`${caminho} em ${largura}px`, excesso <= 0, `excesso ${excesso}px`);
    await pagina.close();
  }
}

// ─── Formulário: validação ────────────────────────────────────────────────
console.log("\n== formulário vazio ==");
{
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 390, height: 900 });
  await pagina.goto(`${BASE}/#inscricao`, { waitUntil: "networkidle2" });

  await pagina.evaluate(() => {
    document.querySelector('button[type="submit"]').click();
  });
  await pagina.waitForFunction(
    () => document.querySelector('[role="alert"]') !== null,
    { timeout: 15000 },
  );

  const erros = await pagina.evaluate(() =>
    [...document.querySelectorAll("p.text-alerta, [role='alert']")].map((e) =>
      e.textContent.trim(),
    ),
  );
  console.log("  mensagens:", JSON.stringify(erros, null, 0).slice(0, 500));
  conferir("recusa o envio vazio", erros.length >= 4);
  conferir(
    "cobra a modalidade",
    erros.some((e) => e.toLowerCase().includes("modalidade")),
  );
  conferir(
    "cobra o ponto de coleta",
    erros.some((e) => e.toLowerCase().includes("brinquedo")),
  );
  await pagina.screenshot({ path: `${SAIDA}/rachao-form-erros.png` });
  await pagina.close();
}

// ─── Bloco do responsável ─────────────────────────────────────────────────
console.log("\n== quando aparece o termo do responsável ==");
{
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 390, height: 900 });
  await pagina.goto(`${BASE}/#inscricao`, { waitUntil: "networkidle2" });

  const temTermo = () =>
    pagina.evaluate(
      () => document.querySelector('input[name="responsavelNome"]') !== null,
    );

  conferir("some antes de escolher", !(await temTermo()));

  // Rachão + adulto: não deve pedir responsável.
  await pagina.evaluate(() => {
    document.querySelector('input[value="rachao"]').click();
  });
  await pagina.evaluate(() => {
    const campo = document.querySelector('input[name="nascimento"]');
    const setar = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set;
    setar.call(campo, "1990-05-10");
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  });
  conferir("Rachão com adulto não pede responsável", !(await temTermo()));

  // Rachão + menor: deve pedir, mesmo não sendo Pedal Kids.
  await pagina.evaluate(() => {
    const campo = document.querySelector('input[name="nascimento"]');
    const setar = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set;
    setar.call(campo, "2012-05-10");
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  });
  conferir("Rachão com menor pede responsável", await temTermo());

  // Pedal Kids: sempre pede.
  await pagina.evaluate(() => {
    document.querySelector('input[value="pedal-kids"]').click();
  });
  conferir("Pedal Kids pede responsável", await temTermo());

  const rotulo = await pagina.evaluate(() => {
    const campo = document.querySelector('input[name="nome"]');
    return document.querySelector(`label[for="${campo.id}"]`).textContent.trim();
  });
  conferir("rótulo vira 'da criança'", rotulo.includes("criança"), rotulo);

  await pagina.screenshot({
    path: `${SAIDA}/rachao-form-kids.png`,
    fullPage: true,
  });
  await pagina.close();
}

// ─── Painel: senha ────────────────────────────────────────────────────────
console.log("\n== painel ==");
{
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1366, height: 900 });
  await pagina.goto(`${BASE}/painel`, { waitUntil: "networkidle2" });

  await pagina.type("#senha", "senha-errada");
  await pagina.evaluate(() =>
    document.querySelector('button[type="submit"]').click(),
  );
  await pagina.waitForFunction(
    () => document.querySelector("#erro-senha") !== null,
    { timeout: 15000 },
  );
  const erro = await pagina.$eval("#erro-senha", (e) => e.textContent.trim());
  conferir("recusa senha errada", erro.includes("incorreta"), erro);
  await pagina.close();
}

await navegador.close();
console.log(falhas === 0 ? "\nTudo certo." : `\n${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
