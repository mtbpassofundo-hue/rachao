/**
 * Desenha o ícone do site: bicicleta em verde-petróleo sobre o limão do
 * flyer.
 *
 * O logo do Clube não serve aqui — ele é uma assinatura horizontal com letra
 * fina, e a 32 pixels na aba do navegador vira um borrão cinza. Uma bike
 * cheia, em duas cores de alto contraste, continua reconhecível no tamanho
 * que o navegador realmente usa.
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const exigir = createRequire("file:///C:/Users/Yuri/MTBPF/package.json");
const puppeteer = exigir("puppeteer-core");

const LADO = 512;

const desenho = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="#95f43e"/>
  <g fill="none" stroke="#072e2d" stroke-width="26"
     stroke-linecap="round" stroke-linejoin="round">
    <circle cx="140" cy="330" r="86"/>
    <circle cx="372" cy="330" r="86"/>
    <!-- Quadro: selim, pedal e guidão, na proporção de uma bike de verdade. -->
    <path d="M140 330 L222 330 L300 196 L372 330"/>
    <path d="M222 330 L286 196"/>
    <path d="M258 180 h58"/>
    <path d="M300 196 L360 196"/>
  </g>
  <circle cx="222" cy="330" r="20" fill="#072e2d"/>
</svg>`;

const navegador = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--no-sandbox"],
});

const pagina = await navegador.newPage();
await pagina.setViewport({ width: LADO, height: LADO, deviceScaleFactor: 1 });
await pagina.setContent(
  `<!doctype html><html><head><meta charset="utf-8"><style>
     html,body{margin:0;padding:0;width:${LADO}px;height:${LADO}px;overflow:hidden}
   </style></head><body>${desenho}</body></html>`,
  { waitUntil: "networkidle0" },
);

const imagem = await pagina.screenshot({
  type: "png",
  omitBackground: true,
  clip: { x: 0, y: 0, width: LADO, height: LADO },
});

writeFileSync("C:/Users/Yuri/RACHAO/app/icon.png", imagem);
console.log("app/icon.png:", (imagem.length / 1024).toFixed(0), "KB");

await navegador.close();
