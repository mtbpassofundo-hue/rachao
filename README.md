# Rachão Bike 2026 — inscrição

**No ar: <https://rachaobike.vercel.app>** · guia do dia a dia em [OPERACAO.md](OPERACAO.md)

Site de inscrição do **Rachão Bike 2026**, promovido pelo Clube Comercial com
apoio do Rachão da Noite (RDN). A inscrição não custa dinheiro: custa um
brinquedo, entregue em um dos quatro pontos de coleta até **26/11/2026** e
doado a crianças carentes.

Next.js 16 (App Router) + Tailwind 4 + Supabase (Postgres).

| Página | O que é |
| --- | --- |
| `/` | Capa, a causa, modalidades, pontos de coleta e o formulário. |
| `/inscritos` | Lista pública — só nome e modalidade. |
| `/painel` | Lista completa, com senha. Marca brinquedo entregue. |
| `/painel/relatorio` | Baixa o `.xlsx` de todos os inscritos. Exige sessão. |

## 1. Criar a tabela no Supabase

O site usa o **mesmo projeto Supabase** do site do MTB Passo Fundo, em tabela
separada (`inscricoes_rachao`). Nada aqui encosta em `pedidos_desconto`.

1. Abra o projeto em <https://supabase.com> → **SQL Editor**.
2. Cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e rode.
3. Confira com `node scripts/sondar.mjs` — ele diz se a tabela respondeu.

> Se o projeto estiver **pausado** (plano gratuito pausa por inatividade), o
> endereço `*.supabase.co` some do DNS e o site não grava nada. Nesse caso,
> despause no painel da Supabase antes de qualquer outra coisa.

## 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha. O
[`scripts/montar-env.mjs`](scripts/montar-env.mjs) faz isso sozinho, puxando
a URL e a chave do `.env.local` do MTBPF e sorteando senha e segredo novos.

| Variável | Para quê |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Endereço do projeto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta que grava e lê as inscrições. Nunca vai para o navegador. |
| `SENHA_PAINEL` | Senha única de `/painel`. |
| `SESSAO_SEGREDO` | Assina o cookie da sessão. Mínimo de 32 caracteres. |
| `NEXT_PUBLIC_SITE_URL` | Opcional, só se o clube registrar domínio próprio. |

As mesmas quatro precisam estar cadastradas na Vercel, em
**Settings → Environment Variables**.

## 3. Rodar

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
npm run lint
npm run type-check
```

## 4. Mudar os dados do evento

Quase tudo que muda de um ano para o outro mora em
[`lib/evento.ts`](lib/evento.ts): data, horários, local, prazo do brinquedo,
pontos de coleta, modalidades, premiação, telefone do coordenador e o termo do
responsável. O site inteiro — e o flyer — leem de lá.

O prazo das inscrições é a constante `FIM_DAS_INSCRICOES`, no mesmo arquivo.
Está colada no prazo do brinquedo de propósito: inscrição sem brinquedo
entregue não vale.

## 5. Refazer o flyer

```bash
npm run flyer     # regrava public/flyer.jpg a partir de scripts/flyer/peca.html
```

A peça tem 1080×1350, igual à do ano passado. O script mede se o rodapé cabe no
quadro e falha se passar, em vez de cortar calado.

Os dois logos de `public/` foram recortados do flyer de 2025 e do símbolo que o
RDN mandou — ambos ficaram em PNG com fundo transparente. Se aparecer uma
versão vetorial do logo do Clube Comercial, é só trocar o arquivo:
`logo-comercial.png` tem só 326×80, que serve para tela mas é pouco para
impressão grande.

## Como as coisas foram decididas

**Uma inscrição por CPF.** É a trava do banco (`unique`), não uma conferência
no formulário — dois toques no botão não viram duas vagas.

**Menor de idade pede responsável.** Sempre no Pedal Kids, e também nas outras
modalidades quando a data de nascimento mostrar que a pessoa não tem 18 anos
no dia da prova. O banco recusa criança sem responsável mesmo que alguém
escreva direto na tabela.

**A lista pública não lê CPF.** A consulta de `/inscritos` pede só nome,
modalidade e data. O dado sensível não sai do servidor porque nem chega a ser
buscado.

**O relatório é `.xlsx` de verdade**, montado em
[`lib/planilha.ts`](lib/planilha.ts) sem dependência nenhuma — um `.xlsx` é um
ZIP com alguns XML dentro. CSV abriria no Excel, mas depende do separador do
sistema e do aviso de importação, e quem vai abrir isso está com pressa no dia
da prova.
