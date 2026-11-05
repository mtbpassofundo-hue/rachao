# O site está no ar

**https://rachaobike.vercel.app**

| Endereço | Para quê |
| --- | --- |
| `/` | Capa, a causa, modalidades, pontos de coleta e o formulário. |
| `/inscritos` | Lista pública. Só nome e modalidade. |
| `/painel` | Lista completa, com senha. |
| `/painel/relatorio` | Baixa o Excel. Só funciona com a sessão do painel aberta. |

A senha do painel está no `.env.local` desta pasta, em `SENHA_PAINEL`. Para
trocar, mude lá **e** em <https://vercel.com/mtbpassofundo-hue/rachaobike/settings/environment-variables>
— a Vercel não lê o arquivo da sua máquina.

## No dia a dia

**Conferir quem entregou o brinquedo.** Entre em `/painel`, ache a pessoa pela
busca (nome, cidade, CPF ou WhatsApp) e marque a caixinha da coluna
*Brinquedo*. O botão **Sem brinquedo** mostra só quem ainda está devendo —
é essa a lista para cobrar na véspera.

**Tirar o relatório.** Botão **Baixar Excel**, no alto do painel. Vem tudo:
nome, modalidade, CPF, nascimento, idade no dia da prova, cidade, WhatsApp,
ponto de coleta, se o brinquedo chegou, e o responsável com CPF e a hora em
que aceitou o termo. Abre direto no Excel, com filtro já ligado.

**A lista pública não mostra CPF nem telefone.** Ela consulta só nome e
modalidade — o dado sensível nem sai do servidor. Pode mandar o link no grupo
sem medo.

## Mudar alguma coisa do evento

Quase tudo mora em [`lib/evento.ts`](lib/evento.ts): data, horários, local,
prazo do brinquedo, pontos de coleta, modalidades, premiação, telefone e o
termo do responsável.

```bash
# depois de mudar lib/evento.ts
npm run flyer     # refaz public/flyer.jpg com os dados novos
git add -A && git commit -m "..." && git push
```

O push publica sozinho: o projeto está ligado ao repositório
`mtbpassofundo-hue/rachao`, e cada commit em `main` vira um deploy.

## Duas coisas para lembrar

**O prazo fecha sozinho.** Em 26/11/2026, às 23h59, o formulário vira um aviso
de inscrições encerradas — a recusa acontece no servidor, então não adianta
alguém deixar a página aberta desde antes. Para esticar o prazo, mude
`FIM_DAS_INSCRICOES` em `lib/evento.ts`.

**O banco dorme.** O projeto Supabase é do plano gratuito e pausa depois de
cerca de uma semana sem acesso. Entre agora e a prova vai ter inscrição quase
todo dia, então ele fica acordado. Mas **depois do evento ele pausa** — e o
painel e o relatório param junto, até alguém restaurar. Baixe o Excel antes de
guardar o evento.

Se um dia o site disser que não conseguiu salvar a inscrição, rode
`node scripts/sondar.mjs`: ele responde se o banco está de pé, antes de você
suspeitar do código.

## Conferir que está tudo certo

```bash
npm run build                     # compila
node scripts/testar-inscricao.mjs # inscreve de mentira no banco e apaga depois
```

O segundo precisa do site rodando em `localhost:3300` (`npx next start -p 3300`).
Ele preenche o formulário num navegador de verdade, confere que criança sem
responsável é recusada, que o mesmo CPF não entra duas vezes, que a lista
pública não vaza CPF, que o painel abre com a senha e que o Excel baixa e
abre — e apaga os dados de teste no fim.
