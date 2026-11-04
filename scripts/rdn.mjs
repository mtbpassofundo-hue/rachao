/**
 * Tira o fundo preto do símbolo do RDN.
 *
 * O logo é dourado sobre preto chapado, então o preto não é "uma cor que eu
 * apago": ele é a ausência de luz. Trato o pixel como pré-multiplicado — o
 * alfa vira o canal mais forte e a cor é dividida por ele. Isso devolve o
 * dourado cheio nas bordas, em vez do halo escuro que um corte por limiar
 * deixaria em volta da lua e da estrela.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";

const exigir = createRequire("file:///C:/Users/Yuri/MTBPF/package.json");
const puppeteer = exigir("puppeteer-core");

const AQUI = "C:/Users/Yuri/RACHAO";
const origem =
  "data:image/png;base64," +
  readFileSync(`${AQUI}/public/logo-rdn.png`).toString("base64");

const navegador = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--no-sandbox"],
});
const pagina = await navegador.newPage();
await pagina.goto("about:blank");

const saida = await pagina.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();

  const L = img.naturalWidth;
  const A = img.naturalHeight;
  const tela = document.createElement("canvas");
  tela.width = L;
  tela.height = A;
  const ctx = tela.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const dados = ctx.getImageData(0, 0, L, A);
  const d = dados.data;
  for (let i = 0; i < d.length; i += 4) {
    const maximo = Math.max(d[i], d[i + 1], d[i + 2]);
    if (maximo === 0) {
      d[i + 3] = 0;
      continue;
    }
    // Abaixo de 18 é o preto do fundo, com o ruído de compressão junto.
    const alfa = maximo <= 18 ? 0 : maximo / 255;
    d[i] = Math.min(255, Math.round(d[i] / alfa));
    d[i + 1] = Math.min(255, Math.round(d[i + 1] / alfa));
    d[i + 2] = Math.min(255, Math.round(d[i + 2] / alfa));
    d[i + 3] = Math.round(alfa * 255);
  }
  ctx.putImageData(dados, 0, 0);

  // Apara a moldura preta que sobra em volta.
  let x0 = L;
  let y0 = A;
  let x1 = 0;
  let y1 = 0;
  for (let py = 0; py < A; py++) {
    for (let px = 0; px < L; px++) {
      if (d[(py * L + px) * 4 + 3] > 24) {
        if (px < x0) x0 = px;
        if (px > x1) x1 = px;
        if (py < y0) y0 = py;
        if (py > y1) y1 = py;
      }
    }
  }

  const aparada = document.createElement("canvas");
  aparada.width = x1 - x0 + 1;
  aparada.height = y1 - y0 + 1;
  aparada
    .getContext("2d")
    .putImageData(dados, -x0, -y0, x0, y0, aparada.width, aparada.height);

  return {
    png: aparada.toDataURL("image/png"),
    tamanho: [aparada.width, aparada.height],
  };
}, origem);

writeFileSync(
  `${AQUI}/public/logo-rdn.png`,
  Buffer.from(saida.png.split(",")[1], "base64"),
);
console.log("logo-rdn.png:", saida.tamanho.join("x"));

await navegador.close();
