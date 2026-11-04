/**
 * Gerador de .xlsx sem dependência nenhuma.
 *
 * Um arquivo do Excel é um ZIP com alguns XML dentro. O ZIP é montado aqui no
 * método "store" — sem compressão —, o que dispensa zlib e deixa o código
 * curto o bastante para caber numa leitura. O relatório tem algumas centenas
 * de linhas; o tamanho extra não faz diferença.
 *
 * Por que não CSV: CSV abre no Excel, mas depende do separador do sistema e
 * do aviso de importação, e acento em máquina mal configurada vira caractere
 * estranho. Quem vai abrir isso está com pressa no dia da prova.
 */

const TEXTO = new TextEncoder();

/** Tabela do CRC-32 usada pelo ZIP, montada uma vez. */
const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let bit = 0; bit < 8; bit++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabela[i] = c >>> 0;
  }
  return tabela;
})();

function crc32(dados: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < dados.length; i++) {
    c = TABELA_CRC[(c ^ dados[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

type ArquivoZip = { nome: string; conteudo: Uint8Array };

/** Data e hora no formato de 16 bits que o ZIP herdou do MS-DOS. */
function carimboDos(quando: Date): { hora: number; data: number } {
  return {
    hora:
      (quando.getHours() << 11) |
      (quando.getMinutes() << 5) |
      (quando.getSeconds() >> 1),
    data:
      ((quando.getFullYear() - 1980) << 9) |
      ((quando.getMonth() + 1) << 5) |
      quando.getDate(),
  };
}

function zipar(arquivos: ArquivoZip[]): Buffer {
  const { hora, data } = carimboDos(new Date());
  const locais: Buffer[] = [];
  const centrais: Buffer[] = [];
  let deslocamento = 0;

  for (const arquivo of arquivos) {
    const nome = TEXTO.encode(arquivo.nome);
    const crc = crc32(arquivo.conteudo);
    const tamanho = arquivo.conteudo.length;

    const cabecalho = Buffer.alloc(30);
    cabecalho.writeUInt32LE(0x04034b50, 0);
    cabecalho.writeUInt16LE(20, 4); // versão necessária
    cabecalho.writeUInt16LE(0, 6); // sem sinalizador
    cabecalho.writeUInt16LE(0, 8); // método 0 = guardado sem comprimir
    cabecalho.writeUInt16LE(hora, 10);
    cabecalho.writeUInt16LE(data, 12);
    cabecalho.writeUInt32LE(crc, 14);
    cabecalho.writeUInt32LE(tamanho, 18);
    cabecalho.writeUInt32LE(tamanho, 22);
    cabecalho.writeUInt16LE(nome.length, 26);
    cabecalho.writeUInt16LE(0, 28); // sem campo extra

    locais.push(cabecalho, Buffer.from(nome), Buffer.from(arquivo.conteudo));

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // versão de quem criou
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(hora, 12);
    central.writeUInt16LE(data, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(tamanho, 20);
    central.writeUInt32LE(tamanho, 24);
    central.writeUInt16LE(nome.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comentário
    central.writeUInt16LE(0, 34); // disco inicial
    central.writeUInt16LE(0, 36); // atributos internos
    central.writeUInt32LE(0, 38); // atributos externos
    central.writeUInt32LE(deslocamento, 42);

    centrais.push(central, Buffer.from(nome));
    deslocamento += 30 + nome.length + tamanho;
  }

  const diretorio = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(0, 4);
  fim.writeUInt16LE(0, 6);
  fim.writeUInt16LE(arquivos.length, 8);
  fim.writeUInt16LE(arquivos.length, 10);
  fim.writeUInt32LE(diretorio.length, 12);
  fim.writeUInt32LE(deslocamento, 16);
  fim.writeUInt16LE(0, 20);

  return Buffer.concat([...locais, diretorio, fim]);
}

function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Tira os caracteres que o XML do Excel não aceita. Nome vindo de formulário
 * pode trazer um controle invisível colado de outro aplicativo, e um único
 * desses faz o Excel recusar a planilha inteira como corrompida.
 */
function limparTexto(valor: string): string {
  return valor.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

/** 0 → A, 25 → Z, 26 → AA. */
function coluna(indice: number): string {
  let nome = "";
  let n = indice;
  while (n >= 0) {
    nome = String.fromCharCode(65 + (n % 26)) + nome;
    n = Math.floor(n / 26) - 1;
  }
  return nome;
}

export type Coluna = { titulo: string; largura: number };
export type Celula = string | number | boolean | null | undefined;

/**
 * Monta a planilha. A primeira linha é o cabeçalho, em negrito e congelada,
 * com o filtro automático já ligado — é o que o Excel precisa para o relatório
 * ser útil sem ninguém configurar nada.
 */
export function montarXlsx(
  aba: string,
  colunas: Coluna[],
  linhas: Celula[][],
): Buffer {
  const celula = (valor: Celula, lin: number, col: number): string => {
    const ref = `${coluna(col)}${lin}`;
    const estilo = lin === 1 ? ' s="1"' : "";
    if (valor === null || valor === undefined || valor === "") {
      return `<c r="${ref}"${estilo}/>`;
    }
    if (typeof valor === "number" && Number.isFinite(valor)) {
      return `<c r="${ref}"${estilo}><v>${valor}</v></c>`;
    }
    const texto = escapar(limparTexto(String(valor)));
    return `<c r="${ref}"${estilo} t="inlineStr"><is><t xml:space="preserve">${texto}</t></is></c>`;
  };

  const corpo = [colunas.map((c) => c.titulo), ...linhas]
    .map(
      (linha, i) =>
        `<row r="${i + 1}">${linha
          .map((valor, j) => celula(valor, i + 1, j))
          .join("")}</row>`,
    )
    .join("");

  const larguras = colunas
    .map(
      (c, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${c.largura}" customWidth="1"/>`,
    )
    .join("");

  const ultima = `${coluna(colunas.length - 1)}${linhas.length + 1}`;

  const planilha =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0" tabSelected="1">` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `</sheetView></sheetViews>` +
    `<cols>${larguras}</cols>` +
    `<sheetData>${corpo}</sheetData>` +
    `<autoFilter ref="A1:${ultima}"/>` +
    `</worksheet>`;

  const arquivos: ArquivoZip[] = [
    {
      nome: "[Content_Types].xml",
      conteudo: TEXTO.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
          `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
          `<Default Extension="xml" ContentType="application/xml"/>` +
          `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
          `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
          `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
          `</Types>`,
      ),
    },
    {
      nome: "_rels/.rels",
      conteudo: TEXTO.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
          `</Relationships>`,
      ),
    },
    {
      nome: "xl/workbook.xml",
      conteudo: TEXTO.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
          `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
          `<sheets><sheet name="${escapar(aba).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets>` +
          `</workbook>`,
      ),
    },
    {
      nome: "xl/_rels/workbook.xml.rels",
      conteudo: TEXTO.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
          `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
          `</Relationships>`,
      ),
    },
    {
      // Dois estilos só: o 0 é o normal e o 1 é o negrito do cabeçalho.
      nome: "xl/styles.xml",
      conteudo: TEXTO.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
          `<fonts count="2">` +
          `<font><sz val="11"/><name val="Calibri"/></font>` +
          `<font><b/><sz val="11"/><name val="Calibri"/></font>` +
          `</fonts>` +
          `<fills count="1"><fill><patternFill patternType="none"/></fill></fills>` +
          `<borders count="1"><border/></borders>` +
          `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
          `<cellXfs count="2">` +
          `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
          `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
          `</cellXfs>` +
          `</styleSheet>`,
      ),
    },
    { nome: "xl/worksheets/sheet1.xml", conteudo: TEXTO.encode(planilha) },
  ];

  return zipar(arquivos);
}
