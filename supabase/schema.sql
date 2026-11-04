-- Estrutura do banco das inscrições do Rachão Bike 2026.
-- Rode uma vez no SQL Editor do projeto Supabase (Database > SQL Editor).
--
-- Mora no mesmo projeto Supabase do site do MTB Passo Fundo, em tabela
-- separada: nada aqui encosta em `pedidos_desconto`.

create table if not exists public.inscricoes_rachao (
  id          uuid        primary key default gen_random_uuid(),
  criado_em   timestamptz not null default now(),

  nome        text        not null,

  -- Os mesmos ids de lib/evento.ts. Texto com CHECK, e não enum, porque
  -- acrescentar uma modalidade vira um ALTER simples.
  categoria   text        not null
    check (categoria in ('rachao', 'cicloturismo', 'pedal-kids')),

  -- Só os 11 dígitos, sem ponto nem traço: é isso que garante uma inscrição
  -- por pessoa, mesmo que ela digite formatado diferente na segunda vez.
  cpf         text        not null unique check (cpf ~ '^[0-9]{11}$'),
  nascimento  date        not null,
  cidade      text        not null,
  whatsapp    text        not null check (whatsapp ~ '^[0-9]{11}$'),

  ponto_coleta text       not null
    check (ponto_coleta in (
      'bike-tour', 'gigante-bike', 'sede-vergueiro', 'sede-campestre'
    )),

  -- Preenchidos quando quem larga é menor de idade: sempre no Pedal Kids, e
  -- também nas outras modalidades se a data de nascimento disser que falta
  -- idade no dia da prova.
  responsavel_nome text,
  responsavel_cpf  text
    check (responsavel_cpf is null or responsavel_cpf ~ '^[0-9]{11}$'),
  termo_aceito_em  timestamptz,

  -- Marcado à mão no painel quando o brinquedo chega ao ponto de coleta. É o
  -- que transforma "inscrito" em "inscrição validada".
  brinquedo_entregue boolean not null default false,

  origem_ip   text,

  -- A trava que importa: criança sem responsável e sem termo não entra, nem
  -- que alguém escreva direto no banco.
  constraint responsavel_no_pedal_kids check (
    categoria <> 'pedal-kids'
    or (
      responsavel_nome is not null
      and responsavel_cpf is not null
      and termo_aceito_em is not null
    )
  )
);

create index if not exists inscricoes_rachao_criado_em_idx
  on public.inscricoes_rachao (criado_em desc);

create index if not exists inscricoes_rachao_categoria_idx
  on public.inscricoes_rachao (categoria);

-- RLS ligado e nenhuma policy criada: a chave anônima (a que vai para o
-- navegador) não lê nem escreve nada aqui. Só a chave de serviço, que fica no
-- servidor, enxerga a tabela — inclusive a lista pública de inscritos, que é
-- montada no servidor e só devolve nome e modalidade.
alter table public.inscricoes_rachao enable row level security;
