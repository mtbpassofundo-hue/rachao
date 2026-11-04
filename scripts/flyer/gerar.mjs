/**
 * Renderiza o flyer em 1080x1350 e grava em public/flyer.jpg.
 *
 * A peça é um HTML servido por um servidor local em vez de aberta por
 * file://: assim as duas marcas carregam como imagem normal e as fontes do
 * Google chegam sem esbarrar em restrição de origem.
 */
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const exigir = createRequire("file:///C:/Users/Yuri/MTBPF/package.json");
const puppeteer = exigir("puppeteer-core");

const RAIZ = "C:/Users/Yuri/RACHAO";
const PECA = join(RAIZ, "scripts/flyer");
const PUBLICO = join(RAIZ, "public");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

// Serve a peça e, para qualquer outro arquivo, procura em public/ — é de lá
// que vêm os dois logos.
const servidor = createServer(async (req, res) => {
  const caminho = (req.url ?? "/").split("?")[0];
  const nome = caminho === "/" ? "peca.html" : caminho.slice(1);
  for (const pasta of [PECA, PUBLICO]) {
    try {
      const conteudo = await readFile(join(pasta, nome));
      res.writeHead(200, {
        "Content-Type": TIPOS[extname(nome)] ?? "application/octet-stream",
      });
      res.end(conteudo);
      return;
    } catch {
      // tenta a próxima pasta
    }
  }
  res.writeHead(404);
  res.end("não encontrado");
});

await new Promise((pronto) => servidor.listen(4387, pronto));

const navegador = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--no-sandbox", "--force-device-scale-factor=1"],
});

const pagina = await navegador.newPage();
await pagina.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
await pagina.goto("http://localhost:4387/", { waitUntil: "networkidle0" });

// Sem isto o retrato sai com a fonte de reserva: o Chrome tira a foto antes
// de a Barlow Condensed terminar de baixar.
await pagina.evaluate(() => document.fonts.ready);

// A peça tem altura fixa e corta o que passar. Já aconteceu de o rodapé com
// o endereço do site ficar fora do quadro sem nada avisar, então aqui a
// medida é conferida antes da foto.
const medida = await pagina.evaluate(() => {
  const rodape = document.querySelector(".rodape");
  const fim = rodape.getBoundingClientRect().bottom;
  return { fim: Math.round(fim), sobra: Math.round(1350 - fim) };
});

if (medida.fim > 1350) {
  throw new Error(
    `O conteúdo passa do quadro: termina em ${medida.fim}px de 1350. Diminua as folgas em peca.html.`,
  );
}
console.log(`rodapé termina em ${medida.fim}px — sobram ${medida.sobra}px`);

const imagem = await pagina.screenshot({
  type: "jpeg",
  quality: 92,
  clip: { x: 0, y: 0, width: 1080, height: 1350 },
});

await writeFile(join(PUBLICO, "flyer.jpg"), imagem);
console.log("public/flyer.jpg:", (imagem.length / 1024).toFixed(0), "KB");

await navegador.close();
servidor.close();
