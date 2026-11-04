// Põe o PNG recortado sobre o verde-petróleo, que é o fundo onde ele vai
// aparecer de verdade — contra o branco do visualizador não dá para julgar.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";

const exigir = createRequire("file:///C:/Users/Yuri/MTBPF/package.json");
const puppeteer = exigir("puppeteer-core");

const AQUI = "C:/Users/Yuri/RACHAO";
const alvo = process.argv[2] ?? "public/logo-comercial.png";
const fundo = process.argv[3] ?? "#072e2d";

const origem =
  "data:image/png;base64," +
  readFileSync(`${AQUI}/${alvo}`).toString("base64");

const navegador = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--no-sandbox"],
});
const pagina = await navegador.newPage();
await pagina.goto("about:blank");

const saida = await pagina.evaluate(
  async (src, cor) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const margem = 40;
    const tela = document.createElement("canvas");
    tela.width = img.naturalWidth + margem * 2;
    tela.height = img.naturalHeight + margem * 2;
    const ctx = tela.getContext("2d");
    ctx.fillStyle = cor;
    ctx.fillRect(0, 0, tela.width, tela.height);
    ctx.drawImage(img, margem, margem);
    return {
      png: tela.toDataURL("image/png"),
      largura: img.naturalWidth,
      altura: img.naturalHeight,
    };
  },
  origem,
  fundo,
);

writeFileSync(
  `${AQUI}/scripts/conferencia.png`,
  Buffer.from(saida.png.split(",")[1], "base64"),
);
console.log(`${alvo}: ${saida.largura}x${saida.altura}`);

await navegador.close();
