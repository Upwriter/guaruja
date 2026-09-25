# Destino Guarujá

Blog de turismo sobre o Guarujá (SP), feito com [Astro](https://astro.build), TypeScript e
Tailwind CSS. O site é 100% estático (sem servidor rodando depois de pronto), pensado para SEO e
para carregar rápido no celular.

Este README explica, em português simples, como rodar o projeto, criar artigos novos e publicar o
site. Não é preciso saber programação avançada — siga os passos na ordem.

## Índice

1. [Como rodar o site no seu computador](#1-como-rodar-o-site-no-seu-computador)
2. [Como criar um novo artigo](#2-como-criar-um-novo-artigo)
3. [Como adicionar imagens aos artigos](#3-como-adicionar-imagens-aos-artigos)
4. [Como ativar o AdSense e o Google Analytics](#4-como-ativar-o-adsense-e-o-google-analytics)
5. [Como publicar no GitHub e conectar à Vercel](#5-como-publicar-no-github-e-conectar-à-vercel)
6. [Comandos úteis](#6-comandos-úteis)
7. [O que ainda precisa da sua atenção](#7-o-que-ainda-precisa-da-sua-atenção)

---

## 1. Como rodar o site no seu computador

Pré-requisito: ter o [Node.js](https://nodejs.org) instalado (versão 22 ou mais recente).

Abra um terminal na pasta do projeto e rode, uma única vez:

```bash
npm install
```

Isso baixa todas as dependências do projeto (só precisa fazer isso de novo se mudar algo no
`package.json`). Depois, para ver o site rodando no seu computador:

```bash
npm run dev
```

Isso abre um endereço parecido com `http://localhost:4321` — copie e cole no navegador. Toda vez
que você salvar um arquivo, o site atualiza sozinho na tela.

Para parar o servidor, volte ao terminal e aperte `Ctrl + C`.

> A busca do site (Pagefind) só funciona depois de um build de produção (`npm run build`), não no
> `npm run dev`. Isso é normal — veja a seção de comandos úteis.

## 2. Como criar um novo artigo

Os artigos ficam dentro de `src/content/blog/`, organizados em pastas por categoria. As categorias
disponíveis são:

`praias`, `o-que-fazer`, `trilhas-e-natureza`, `onde-ficar`, `onde-comer`, `como-chegar`,
`planejamento`, `eventos`, `dicas-praticas`.

Para criar um artigo novo:

1. Escolha a pasta da categoria certa, por exemplo `src/content/blog/praias/`.
2. Crie um novo arquivo `.md` dentro dela. **O nome do arquivo vira o final da URL do artigo**, por
   exemplo `praia-de-pitangueiras.md` vira `/praias/praia-de-pitangueiras/`. Use só letras
   minúsculas, números e hífen, sem acento nem espaço.
3. Cole o modelo abaixo no topo do arquivo e preencha:

```md
---
title: "Título do artigo (até 60 caracteres)"
description: "Resumo do artigo para o Google, entre 120 e 160 caracteres."
pubDate: 2026-01-15
category: "praias"
tags: ["exemplo", "praia"]
draft: true
---

## Primeira seção

Escreva o conteúdo do artigo aqui, usando `##` para cada seção nova.
```

Explicando cada campo:

- **title**: título da página. Tente manter até 60 caracteres para não ser cortado no Google.
- **description**: o resumo que aparece no resultado de busca do Google. Tem que ter **entre 120 e
  160 caracteres** — se for menor ou maior, o site vai dar erro ao rodar (`npm run build`).
- **pubDate**: data de publicação, no formato `AAAA-MM-DD`.
- **updatedDate** (opcional): use quando revisar um artigo antigo, mesmo formato de data. Aparece
  como "Atualizado em" na página.
- **category**: uma das categorias da lista acima, exatamente como está escrita (sem acento).
- **tags** (opcional): lista de palavras-chave livres.
- **heroImage** / **heroAlt** (opcionais): veja a seção 3, sobre imagens.
- **draft**: enquanto for `true`, o artigo **fica invisível no site** (não aparece em listagens,
  na busca nem no sitemap) — é o modo rascunho. Mude para `false` quando o artigo estiver pronto
  para publicar.
- **faq** (opcional): perguntas e respostas que aparecem no fim do artigo e também viram um trecho
  especial ("FAQPage") que o Google entende. Formato:

```md
faq:
  - question: "Pergunta 1?"
    answer: "Resposta 1."
  - question: "Pergunta 2?"
    answer: "Resposta 2."
```

Depois de salvar o arquivo, rode `npm run dev` (ou deixe rodando) para ver o artigo no navegador.

### Sobre os 3 artigos de exemplo

O projeto já vem com 3 artigos de exemplo em `src/content/blog/`, todos marcados como `draft:
true` e com trechos `[VERIFICAR]` espalhados pelo texto. Eles servem só para você entender o
formato — **não têm preços, horários nem endereços reais**, porque isso muda com frequência e
precisa ser conferido em uma fonte oficial antes de publicar. Revise, complete e só então mude
`draft` para `false`.

## 3. Como adicionar imagens aos artigos

1. Coloque o arquivo de imagem dentro de `src/content/blog/<categoria>/`, na mesma pasta do
   artigo (ou em uma subpasta, como `imagens/`).
2. No frontmatter do artigo, aponte para o arquivo com um caminho relativo e preencha o texto
   alternativo (`heroAlt`) — ele é obrigatório sempre que houver imagem, tanto para acessibilidade
   quanto para SEO:

```yaml
heroImage: "./foto-da-praia.jpg"
heroAlt: "Vista aérea da praia de Pitangueiras em um dia ensolarado"
```

O Astro otimiza a imagem automaticamente (redimensiona e comprime) na hora do build — você não
precisa editar a imagem manualmente antes.

Use fotos que você tem direito de usar (tiradas por você ou com licença livre). Não use imagens de
bancos protegidos sem autorização.

## 4. Como ativar o AdSense e o Google Analytics

Por padrão, **anúncios e Google Analytics ficam desligados**. O site já está preparado para os
dois, faltando só as configurações abaixo.

### Google AdSense

1. Crie uma conta em [google.com/adsense](https://www.google.com/adsense) para o domínio
   `destinosguaruja.com.br` e espere a aprovação.
2. No painel do AdSense, copie o seu ID de cliente (algo como `ca-pub-1234567890123456`).
3. Abra `public/ads.txt` e cole a linha exata que o AdSense pedir (removendo o `#` do início).
4. Na Vercel, vá em **Settings → Environment Variables** do projeto e adicione:
   - Nome: `PUBLIC_ADSENSE_CLIENT_ID`
   - Valor: o seu `ca-pub-...`
5. Clique em "Redeploy" (ou faça um novo commit) para o site publicar de novo com a variável.

Os anúncios só aparecem depois que o visitante aceita o banner de cookies — isso é proposital, por
causa da LGPD.

### Google Analytics 4

1. Crie uma propriedade GA4 em [analytics.google.com](https://analytics.google.com) e copie o ID
   de métricas (formato `G-XXXXXXXXXX`).
2. Na Vercel, adicione a variável de ambiente:
   - Nome: `PUBLIC_GA_ID`
   - Valor: o seu `G-...`
3. Redeploy o site.

Assim como o AdSense, o Analytics só roda depois que o visitante aceita cookies.

Para testar essas variáveis no seu computador antes de publicar, copie `.env.example` para um
arquivo chamado `.env` e preencha os valores lá.

## 5. Como publicar no GitHub e conectar à Vercel

### Enviar o projeto para o GitHub

1. Crie um repositório novo e vazio em [github.com/new](https://github.com/new) (não marque
   nenhuma opção de criar README, .gitignore ou licença — o projeto já tem esses arquivos).
2. No terminal, dentro da pasta do projeto, rode (troque a URL pela do seu repositório):

```bash
git remote add origin https://github.com/SEU-USUARIO/destino-guaruja.git
git push -u origin main
```

### Conectar à Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório que você acabou de
   criar no GitHub.
2. A Vercel detecta o Astro automaticamente — não precisa mudar nenhuma configuração de build.
3. Antes de clicar em "Deploy", adicione as variáveis de ambiente que você já tiver
   (`PUBLIC_ADSENSE_CLIENT_ID` e/ou `PUBLIC_GA_ID`), se for o caso. Pode adicionar depois também.
4. Clique em "Deploy" e aguarde. Ao final, a Vercel te dá um endereço `.vercel.app` para conferir.
5. Para usar o domínio `destinosguaruja.com.br`: em **Settings → Domains**, adicione o domínio e
   siga as instruções da Vercel para apontar o DNS (ela mostra exatamente quais registros
   configurar no seu provedor de domínio).

Depois disso, todo `git push` para o branch `main` publica uma nova versão do site automaticamente.

## 6. Comandos úteis

| Comando | O que faz |
| --- | --- |
| `npm install` | Instala as dependências do projeto (rode uma vez, ou quando elas mudarem) |
| `npm run dev` | Roda o site localmente, com atualização automática ao salvar |
| `npm run build` | Gera a versão final do site (pasta `dist/`) e a busca (Pagefind) |
| `npm run preview` | Roda a versão final gerada pelo `build`, para conferir antes de publicar |

## 7. O que ainda precisa da sua atenção

- Os textos de **Sobre**, **Contato**, **Política de Privacidade** e **Termos de Uso** têm trechos
  marcados com `[REVISAR]` — complete com os dados reais antes de publicar (e-mail de contato,
  eventual CNPJ, foro/comarca, etc.).
- Os 3 artigos de exemplo estão em modo rascunho (`draft: true`) e cheios de `[VERIFICAR]` — não
  publique sem conferir preços, horários, endereços e nomes de lugares em uma fonte oficial.
- `public/og-default.svg` é uma imagem de compartilhamento provisória (SVG). O ideal é trocá-la por
  uma imagem `.jpg` ou `.png` de verdade, no tamanho 1200×630 pixels, porque alguns aplicativos
  (WhatsApp, Facebook) exibem SVG de forma inconsistente.
- Substitua o link de exemplo do Booking.com no artigo de "Onde ficar" pelo seu link de afiliado
  real, depois de se cadastrar no programa de parceiros da Booking.com.
