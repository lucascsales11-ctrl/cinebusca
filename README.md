# CineBusca

Aplicação web para buscar filmes, ver detalhes, filtrar por gênero e guardar favoritos. Os dados vêm da API pública do TMDB (The Movie Database), consumida apenas com HTML, CSS e JavaScript (`fetch`).

## Integrantes

| Nome completo | Matrícula |
| --- | --- |
| João Pedro Oliveira | [202510476] |
| Matheus Vitor Teixeira | [202511815] |
| Lucas Sales | [202410332] |

## Links

- **Aplicação (GitHub Pages):** [preencher]
- **Repositório:** [preencher]
- **Vídeo de demonstração:** [Vídeo disponibilizado ao professor]

## APIs e endpoints usados

API: **TMDB** (https://developer.themoviedb.org), com chave gratuita.

| Método | URL | Para que serve no sistema |
| --- | --- | --- |
| GET | `https://api.themoviedb.org/3/movie/popular` | Lista os filmes populares na tela inicial |
| GET | `https://api.themoviedb.org/3/search/movie?query={termo}` | Busca filmes pelo título digitado |
| GET | `https://api.themoviedb.org/3/movie/{id}` | Mostra os detalhes do filme no modal (sinopse, duração, nota, gêneros) |
| GET | `https://api.themoviedb.org/3/genre/movie/list` | Preenche o filtro de gêneros |

Os pôsteres são carregados de `https://image.tmdb.org/t/p/w500`.

## Framework CSS

Bootstrap 5.3.3 (CSS e bundle JavaScript do próprio framework, para o grid, os componentes e o modal).

## Como rodar

1. Crie uma conta gratuita no TMDB e gere uma chave de API.
2. Abra `js/config.js` e substitua `SUA_CHAVE_AQUI` pela sua chave.
3. Abra o `index.html` em um navegador (ou acesse o link do GitHub Pages).

Não há back-end nem instalação: é só HTML, CSS e JavaScript.

## Estrutura

```
index.html        Estrutura da página (header, nav, main, section, footer)
css/estilo.css    Ajustes visuais complementares ao Bootstrap
js/config.js      Chave e URLs da API
js/api.js         Requisições com fetch e tratamento de erros HTTP
js/app.js         Eventos, renderização, favoritos e estados da interface
```

## Tratamento de falhas

- Sem internet ou API fora do ar: aviso na tela com botão "Tentar novamente".
- Erros HTTP (401, 404, 429, 500 etc.): mensagem específica na tela.
- Busca sem resultados: aviso na tela.
- Campo de busca com menos de 2 caracteres: validação antes da chamada à API.
- Carregamento: spinner visível e botão desativado durante a requisição.
