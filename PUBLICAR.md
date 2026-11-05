# Para o site entrar no ar

Três passos. Os dois primeiros são só seus — eu não tenho como fazer login
nas suas contas. Depois do terceiro o endereço existe.

## 1. Despausar o banco (2 minutos)

O projeto Supabase está pausado por inatividade e por isso o endereço
`lodkeavnopebxluztwlo.supabase.co` nem aparece no DNS. Enquanto ele estiver
assim, nenhuma inscrição grava.

1. Entre em <https://supabase.com/dashboard> e abra o projeto.
2. Clique em **Restore project** e espere subir (costuma levar 2 a 5 minutos).
3. Abra **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql)
   e rode. Isso cria a tabela `inscricoes_rachao`, separada da tabela do MTB.
4. Me avise: eu rodo `node scripts/sondar.mjs` e confirmo que o banco respondeu.

> O plano gratuito pausa de novo depois de cerca de uma semana **sem nenhum
> acesso ao banco**. Entre hoje e 29/11 vai ter inscrição entrando quase todo
> dia, então ele não deve pausar sozinho. Mas **depois da prova ele pausa** — e
> o painel e o relatório param junto. Baixe o Excel antes de guardar o evento.

## 2. Criar o repositório (1 minuto)

Em <https://github.com/new>, logado como **mtbpassofundo-hue**:

- **Repository name:** `rachao`
- **Private** ou **Public**, como preferir
- **Não** marque "Add a README" — o repositório daqui já tem um

Depois é só me avisar; o `git remote` local já aponta para lá e o envio é um
comando só.

## 3. Publicar na Vercel

Rode uma vez, no terminal:

```
vercel login
```

Ele abre o navegador para confirmar. Feito isso, me avise que eu publico com o
nome `rachaobike` — é o nome do projeto na Vercel que dá o endereço
**rachaobike.vercel.app**.

Se preferir fazer pela interface: <https://vercel.com/new>, importe o repo
`rachao`, e no campo **Project Name** escreva exatamente `rachaobike`.

### As quatro variáveis de ambiente

Na Vercel, em **Settings → Environment Variables**, marcando Production,
Preview e Development nas quatro. Os valores estão no `.env.local` desta
pasta — abra o arquivo e copie de lá, não digite de cabeça:

| Nome | De onde vem |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` |
| `SENHA_PAINEL` | A senha de `/painel`. Está no `.env.local`. |
| `SESSAO_SEGREDO` | Já sorteado no `.env.local`. Não precisa ser igual ao do MTB. |

Sem elas o site sobe, mas quebra na primeira inscrição.

---

## Sobre o endereço

O nome do projeto na **Vercel** é o que vira o endereço. O **Supabase** não
tem nada a ver com isso — ele é só o banco, atrás do site. Dá para usar o
mesmo projeto Supabase do MTB Passo Fundo e ainda assim o endereço ser
`rachao.vercel.app`, porque são serviços diferentes.

**`rachao.vercel.app` não dá:** o nome já é de outra pessoa, um projeto
chamado "rachao-manager". Conferi em 04/11/2026 — o endereço responde, e a
Vercel não deixa dois projetos com o mesmo nome.

Estes quatro estavam livres na mesma data:

| Endereço | Comentário |
| --- | --- |
| `rachaobike.vercel.app` | O mais curto dos livres e o mais fácil de ditar no telefone. |
| `rachaobike2026.vercel.app` | Deixa o ano claro, mas envelhece na próxima edição. |
| `rachao-comercial.vercel.app` | Amarra no clube; o hífen atrapalha um pouco na fala. |
| `rachaobikepf.vercel.app` | Fecha com Passo Fundo. |

Nome livre hoje pode não estar livre semana que vem, então vale decidir logo.
