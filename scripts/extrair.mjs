/**
 * Tira do flyer de 2025 o que vai servir de base para o de 2026: as cores
 * exatas das faixas e o logo do Clube Comercial recortado do topo.
 *
 * O logo é branco puro sobre foto escura, então o recorte vira PNG
 * transparente por luminância — cada pixel entra com alfa proporcional ao
 * quanto ele é claro. Isso preserva a borda suave das letras, coisa que um
 * corte seco de limiar comeria.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";

const exigir = createRequire("file:///C:/Users/Yuri/MTBPF/package.json");
const puppeteer = exigir("puppeteer-core");

const AQUI = "C:/Users/Yuri/RACHAO";

// A página roda em about:blank, que não tem permissão para abrir file://.
// O jeito curto é levar o JPEG embutido como data URL.
const ORIGEM =
  "data:image/jpeg;base64," +
  readFileSync(`${AQUI}/scripts/flyer-2025.jpeg`).toString("base64");

const navegador = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--no-sandbox", "--allow-file-access-from-files"],
});

const pagina = await navegador.newPage();
await pagina.goto("about:blank");

const resultado = await pagina.evaluate(async (origem) => {
  const img = new Image();
  img.src = origem;
  await img.decode();

  const tela = document.createElement("canvas");
  tela.width = img.naturalWidth;
  tela.height = img.naturalHeight;
  const ctx = tela.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const hex = (r, g, b) =>
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

  const corEm = (x, y) => {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return hex(d[0], d[1], d[2]);
  };

  // Cor que mais aparece numa faixa — evita pegar justo um pixel de borda.
  const corDominante = (x0, y0, x1, y1) => {
    const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    const contagem = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const c = hex(d[i], d[i + 1], d[i + 2]);
      contagem.set(c, (contagem.get(c) ?? 0) + 1);
    }
    return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0][0];
  };

  const L = img.naturalWidth;
  const A = img.naturalHeight;

  return {
    largura: L,
    altura: A,
    // A faixa limão larga do título, bem no meio dela.
    limao: corDominante(
      Math.round(L * 0.05),
      Math.round(A * 0.235),
      Math.round(L * 0.2),
      Math.round(A * 0.25),
    ),
    // Caixa escura de "CICLOTURISMO & COMPETIÇÃO".
    petroleo: corDominante(
      Math.round(L * 0.3),
      Math.round(A * 0.185),
      Math.round(L * 0.45),
      Math.round(A * 0.195),
    ),
    // Caixa escura das categorias, que é mais transparente sobre a foto.
    caixa: corDominante(
      Math.round(L * 0.2),
      Math.round(A * 0.53),
      Math.round(L * 0.4),
      Math.round(A * 0.55),
    ),
    amostras: {
      tituloLimao: corEm(Math.round(L * 0.1), Math.round(A * 0.245)),
      faixaChuva: corEm(Math.round(L * 0.08), Math.round(A * 0.775)),
      selo: corEm(Math.round(L * 0.9), Math.round(A * 0.86)),
    },
  };
}, ORIGEM);

console.log(JSON.stringify(resultado, null, 2));

// ─── Logo do Clube Comercial ────────────────────────────────────────────────
const logo = await pagina.evaluate(
  async (origem, caixa) => {
    const img = new Image();
    img.src = origem;
    await img.decode();

    const { x, y, largura, altura } = caixa;
    const tela = document.createElement("canvas");
    tela.width = largura;
    tela.height = altura;
    const ctx = tela.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, x, y, largura, altura, 0, 0, largura, altura);

    const dados = ctx.getImageData(0, 0, largura, altura);
    const d = dados.data;
    for (let i = 0; i < d.length; i += 4) {
      // Luminância percebida: o logo é branco, o fundo é foto escura.
      const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      // Piso alto de propósito: a foto por baixo tem céu e prédio claros, e
      // um piso baixo traria essa sujeira junto com as letras.
      const alfa = Math.max(0, Math.min(1, (lum - 115) / 125));
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
      d[i + 3] = Math.round(alfa * 255);
    }
    ctx.putImageData(dados, 0, 0);

    // Apara as bordas vazias: assim a caixa pode ser folgada sem deixar
    // margem morta em volta do logo.
    let x0 = largura;
    let y0 = altura;
    let x1 = 0;
    let y1 = 0;
    for (let py = 0; py < altura; py++) {
      for (let px = 0; px < largura; px++) {
        if (d[(py * largura + px) * 4 + 3] > 24) {
          if (px < x0) x0 = px;
          if (px > x1) x1 = px;
          if (py < y0) y0 = py;
          if (py > y1) y1 = py;
        }
      }
    }
    if (x1 < x0 || y1 < y0) return { png: tela.toDataURL("image/png") };

    const aparada = document.createElement("canvas");
    aparada.width = x1 - x0 + 1;
    aparada.height = y1 - y0 + 1;
    aparada
      .getContext("2d")
      .putImageData(dados, -x0, -y0, x0, y0, aparada.width, aparada.height);

    return {
      png: aparada.toDataURL("image/png"),
      caixaUsada: { x0, y0, x1, y1 },
      tamanho: [aparada.width, aparada.height],
    };
  },
  ORIGEM,
  // Caixa folgada em volta da assinatura no topo: o aparo acima resolve o
  // resto, então aqui basta não cortar nada.
  {
    x: Math.round(resultado.largura * 0.3),
    y: Math.round(resultado.altura * 0.055),
    largura: Math.round(resultado.largura * 0.42),
    altura: Math.round(resultado.altura * 0.105),
  },
);

writeFileSync(
  `${AQUI}/public/logo-comercial.png`,
  Buffer.from(logo.png.split(",")[1], "base64"),
);
console.log("recorte:", JSON.stringify(logo.caixaUsada), logo.tamanho);
console.log("logo-comercial.png gravado");

await navegador.close();
