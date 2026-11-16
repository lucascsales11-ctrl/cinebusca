// Camada de acesso à API: centraliza as requisições com fetch e o tratamento de erros.
import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_LANGUAGE } from "./config.js";

// Erro próprio da aplicação, com mensagem pronta para mostrar ao usuário.
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const HTTP_MESSAGES = {
  401: "A chave de API é inválida. Verifique o arquivo js/config.js.",
  404: "Conteúdo não encontrado.",
  429: "Muitas requisições em pouco tempo. Aguarde um instante e tente de novo.",
};

// Função genérica: monta a URL, faz o fetch e valida a resposta.
async function getJson(path, params = {}) {
  const url = new URL(TMDB_BASE_URL + path);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", TMDB_LANGUAGE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  // 1) Falha de rede ou API fora do ar: o fetch rejeita a Promise.
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new ApiError("Não foi possível conectar à API. Verifique sua internet e tente de novo.");
  }

  // 2) Erro HTTP (404, 500 etc.): confere response.ok antes de usar os dados.
  if (!response.ok) {
    const message = HTTP_MESSAGES[response.status] ?? `O servidor respondeu com erro (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return response.json();
}

// Endpoint 1: GET /movie/popular — filmes populares (tela inicial).
export const getPopularMovies = (page = 1) => getJson("/movie/popular", { page });

// Endpoint 2: GET /search/movie — busca de filmes pelo título.
export const searchMovies = (query) => getJson("/search/movie", { query });

// Endpoint 3: GET /movie/{id} — detalhes de um filme (modal).
export const getMovieDetails = (id) => getJson(`/movie/${id}`);

// Endpoint 4: GET /genre/movie/list — lista de gêneros (filtro).
export const getGenres = () => getJson("/genre/movie/list");
