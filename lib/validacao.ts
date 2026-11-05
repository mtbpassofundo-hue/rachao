import { z } from "zod";

import {
  CATEGORIAS,
  CATEGORIA_INFANTIL,
  EVENTO,
  PONTOS_COLETA,
} from "@/lib/evento";

/** Deixa só os dígitos — usado antes de validar CPF e telefone. */
export function somenteDigitos(valor: string): string {
  return valor.replace(/\D+/g, "");
}

/** Colapsa espaços repetidos e tira as pontas. */
export function limparNome(valor: string): string {
  return valor.replace(/\s+/g, " ").trim();
}

/**
 * Validação real de CPF (os dois dígitos verificadores), não só a contagem de
 * caracteres. Rejeita também os repetidos como 111.111.111-11, que passam na
 * conta mas não existem.
 */
export function cpfValido(cpf: string): boolean {
  const digitos = somenteDigitos(cpf);
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  const verificador = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i++) {
      soma += Number(digitos[i]) * (ate + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return (
    verificador(9) === Number(digitos[9]) &&
    verificador(10) === Number(digitos[10])
  );
}

/** Celular brasileiro com DDD: 11 dígitos e o nono dígito começando em 9. */
export function whatsappValido(numero: string): boolean {
  const digitos = somenteDigitos(numero);
  if (digitos.length !== 11) return false;
  const ddd = Number(digitos.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  return digitos[2] === "9";
}

/** 000.000.000-00 */
export function formatarCpf(cpf: string): string {
  const d = somenteDigitos(cpf).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** (54) 99999-9999 */
export function formatarWhatsapp(numero: string): string {
  const d = somenteDigitos(numero).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 2005-03-19 → 19/03/2005, sem passar por Date (evita fuso). */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

/**
 * Idade completa no dia da prova, em anos.
 *
 * Comparo as strings ISO em vez de criar Date: `new Date("2015-06-01")` nasce
 * em UTC e, no fuso de Passo Fundo, volta um dia — o que faz quem faz
 * aniversário na véspera aparecer um ano mais novo.
 */
export function idadeNoEvento(nascimentoIso: string): number {
  const [ano, mes, dia] = nascimentoIso.slice(0, 10).split("-").map(Number);
  const [anoE, mesE, diaE] = EVENTO.dataIso.split("-").map(Number);
  let idade = anoE - ano;
  if (mesE < mes || (mesE === mes && diaE < dia)) idade -= 1;
  return idade;
}

/** Menor de idade no dia da prova é quem precisa de responsável no termo. */
export function precisaResponsavel(
  categoria: string,
  nascimentoIso: string,
): boolean {
  if (categoria === CATEGORIA_INFANTIL) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimentoIso)) return false;
  return idadeNoEvento(nascimentoIso) < 18;
}

const HOJE = () => new Date().toISOString().slice(0, 10);

const IDS_CATEGORIA = CATEGORIAS.map((c) => c.id) as readonly string[];
const IDS_PONTO = PONTOS_COLETA.map((p) => p.id) as readonly string[];

const cpfBase = (rotulo: string) =>
  z
    .string()
    .transform(somenteDigitos)
    .refine(cpfValido, `${rotulo} inválido — confira os números.`);

const nomeBase = (rotulo: string) =>
  z
    .string()
    .transform(limparNome)
    .refine((v) => v.length >= 5, `Escreva o ${rotulo} completo.`)
    .refine((v) => v.length <= 80, "Nome longo demais.")
    .refine(
      (v) => v.split(" ").filter((p) => p.length >= 2).length >= 2,
      "Escreva nome e sobrenome.",
    );

export const esquemaInscricao = z
  .object({
    nome: nomeBase("nome"),

    categoria: z
      .string()
      .refine((v) => IDS_CATEGORIA.includes(v), "Escolha uma modalidade."),

    cpf: cpfBase("CPF"),

    nascimento: z
      .string()
      .refine(
        (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
        "Informe a data de nascimento.",
      )
      .refine((v) => v >= "1920-01-01", "Data de nascimento inválida.")
      .refine((v) => v <= HOJE(), "A data de nascimento não pode ser no futuro."),

    cidade: z
      .string()
      .transform(limparNome)
      .refine((v) => v.length >= 2, "Informe a cidade.")
      .refine((v) => v.length <= 60, "Nome de cidade longo demais."),

    whatsapp: z
      .string()
      .transform(somenteDigitos)
      .refine(
        whatsappValido,
        "Informe o WhatsApp com DDD, por exemplo (54) 99999-9999.",
      ),

    pontoColeta: z
      .string()
      .refine(
        (v) => IDS_PONTO.includes(v),
        "Escolha onde você vai deixar o brinquedo.",
      ),

    // Vazio quando a inscrição é de maior de idade fora do Pedal Kids; o
    // superRefine abaixo é quem cobra quando faz falta.
    //
    // A limpeza vale mesmo para o campo opcional: sem ela o CPF do
    // responsável chegava ao banco escrito "999.888.555-83", com ponto e
    // traço, e batia no CHECK que exige onze dígitos puros — enquanto o CPF
    // de quem pedala, esse sim transformado, passava liso. O erro só aparecia
    // na inscrição de criança, que é justamente a que não pode falhar.
    responsavelNome: z
      .string()
      .optional()
      .transform((valor) => limparNome(valor ?? "")),
    responsavelCpf: z
      .string()
      .optional()
      .transform((valor) => somenteDigitos(valor ?? "")),
    termo: z.boolean(),

    confirmacao: z.literal(
      true,
      "É preciso confirmar que os dados são verdadeiros.",
    ),
  })
  .superRefine((dados, ctx) => {
    // Pedal Kids é prova de criança: adulto inscrito ali larga na hora errada,
    // num percurso que não é o dele.
    if (
      dados.categoria === CATEGORIA_INFANTIL &&
      /^\d{4}-\d{2}-\d{2}$/.test(dados.nascimento) &&
      idadeNoEvento(dados.nascimento) >= 18
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["categoria"],
        message:
          "O Pedal Kids é só para menores de 18 anos. Para adultos, escolha Rachão ou Cicloturismo.",
      });
      return;
    }

    if (!precisaResponsavel(dados.categoria, dados.nascimento)) return;

    const nome = limparNome(dados.responsavelNome ?? "");
    if (
      nome.length < 5 ||
      nome.split(" ").filter((p) => p.length >= 2).length < 2
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["responsavelNome"],
        message: "Escreva o nome completo do responsável.",
      });
    }

    if (!cpfValido(dados.responsavelCpf ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["responsavelCpf"],
        message: "CPF do responsável inválido — confira os números.",
      });
    }

    if (!dados.termo) {
      ctx.addIssue({
        code: "custom",
        path: ["termo"],
        message: "O responsável precisa aceitar o termo para inscrever.",
      });
    }
  });

export type DadosInscricao = z.infer<typeof esquemaInscricao>;
