/**
 * Prepara as fotos do evento para a web.
 *
 * Os originais têm 3.500 px e quase 4 MB cada: mandar isso para o celular de
 * quem abre a página no 4G da estrada seria desperdício. Aqui cada uma sai em
 * dois tamanhos, com a redução feita em etapas — reduzir 3.500 para 1.600 de
 * uma vez só deixa a imagem com aspecto serrilhado, porque o navegador
 * descarta pixels em vez de misturá-los.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";

const exigir = createRequire("file:///C:/Users/Yuri/MTBPF/package.json");
const puppeteer = exigir("puppeteer-core");

const ORIGEM = "C:/Users/Yuri/Downloads";
const DESTINO = "C:/Users/Yuri/RACHAO/public/fotos";

const TRABALHOS = [
  {
    origem: "RVC_1646.jpg",
    saidas: [
      { nome: "largada.jpg", largura: 1600, qualidade: 0.82 },
      { nome: "largada-og.jpg", largura: 1200, qualidade: 0.8, recorte: 1200 / 630 },
    ],
  },
  {
    origem: "RVC_3008.jpg",
    saidas: [
      { nome: "pelotao.jpg", largura: 1600, qualidade: 0.82 },
      // Para o fundo do flyer, que é retrato: recorta em 1080x1350.
      { nome: "pelotao-retrato.jpg", largura: 1080, qualidade: 0.84, recorte: 1080 / 1350 },
    ],
  },
];

const navegador = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--no-sandbox"],
});
const pagina = await navegador.newPage();
await pagina.goto("about:blank");

for (const trabalho of TRABALHOS) {
  const bytes = readFileSync(`${ORIGEM}/${trabalho.origem}`);
  const dataUrl = `data:image/jpeg;base64,${bytes.toString("base64")}`;
  console.log(
    `\n${trabalho.origem}: ${(bytes.length / 1024 / 1024).toFixed(1)} MB`,
  );

  for (const saida of trabalho.saidas) {
    const resultado = await pagina.evaluate(
      async (src, largura, qualidade, recorte) => {
        const img = new Image();
        img.src = src;
        await img.decode();

        // Área de origem: ou a imagem inteira, ou o recorte central na
        // proporção pedida.
        let sx = 0;
        let sy = 0;
        let sw = img.naturalWidth;
        let sh = img.naturalHeight;
        if (recorte) {
          const proporcao = sw / sh;
          if (proporcao > recorte) {
            sw = Math.round(sh * recorte);
            sx = Math.round((img.naturalWidth - sw) / 2);
          } else {
            sh = Math.round(sw / recorte);
            // Recorte um pouco acima do centro: em foto de gente, o que
            // interessa são os rostos, e eles ficam no terço de cima.
            sy = Math.round((img.naturalHeight - sh) * 0.35);
          }
        }

        const altura = Math.round((largura * sh) / sw);

        // Redução em etapas de no máximo metade por vez.
        let atualL = sw;
        let atualA = sh;
        let tela = document.createElement("canvas");
        tela.width = atualL;
        tela.height = atualA;
        let ctx = tela.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, atualL, atualA);

        while (atualL > largura * 2) {
          const proximaL = Math.max(largura, Math.round(atualL / 2));
          const proximaA = Math.round((proximaL * atualA) / atualL);
          const passo = document.createElement("canvas");
          passo.width = proximaL;
          passo.height = proximaA;
          const pctx = passo.getContext("2d");
          pctx.imageSmoothingEnabled = true;
          pctx.imageSmoothingQuality = "high";
          pctx.drawImage(tela, 0, 0, proximaL, proximaA);
          tela = passo;
          atualL = proximaL;
          atualA = proximaA;
        }

        const final = document.createElement("canvas");
        final.width = largura;
        final.height = altura;
        const fctx = final.getContext("2d");
        fctx.imageSmoothingEnabled = true;
        fctx.imageSmoothingQuality = "high";
        fctx.drawImage(tela, 0, 0, largura, altura);

        return {
          jpeg: final.toDataURL("image/jpeg", qualidade),
          largura,
          altura,
          origem: `${img.naturalWidth}x${img.naturalHeight}`,
        };
      },
      dataUrl,
      saida.largura,
      saida.qualidade,
      saida.recorte ?? null,
    );

    const saidaBytes = Buffer.from(resultado.jpeg.split(",")[1], "base64");
    writeFileSync(`${DESTINO}/${saida.nome}`, saidaBytes);
    console.log(
      `  ${saida.nome}: ${resultado.largura}x${resultado.altura} · ${(saidaBytes.length / 1024).toFixed(0)} KB (de ${resultado.origem})`,
    );
  }
}

await navegador.close();
