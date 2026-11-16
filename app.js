// Lógica da interface: eventos, renderização, favoritos e estados (carregando, erro, vazio).
import { getPopularMovies, searchMovies, getMovieDetails, getGenres, ApiError } from "./api.js";
import { TMDB_IMAGE_BASE } from "./config.js";

const FAVORITES_KEY = "cinebusca-favoritos";

const EMPTY_MESSAGES = {
  popular: "Nenhum filme popular disponível no momento.",
  search: "Nenhum resultado para esta busca. Tente outro termo.",
  favorites: "Você ainda não tem favoritos. Abra um filme e clique em Adicionar aos favoritos.",
};

const el = {
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-input"),
  searchBtn: document.querySelector("#search-btn"),
  genreSelect: document.querySelector("#genre-select"),
  genreHelp: document.querySelector("#genre-help"),
  navPopular: document.querySelector("#nav-popular"),
  navFavorites: document.querySelector("#nav-favorites"),
  feedback: document.querySelector("#feedback"),
  feedbackText: document.querySelector("#feedback-text"),
  retryBtn: document.querySelector("#retry-btn"),
  loading: document.querySelector("#loading"),
  grid: document.querySelector("#movie-grid"),
  modal: document.querySelector("#movie-modal"),
  modalTitle: document.querySelector("#modal-title"),
  modalBody: document.querySelector("#modal-body"),
  favBtn: document.querySelector("#fav-btn"),
};

// Estado da aplicação
let currentView = "popular"; // "popular" | "search" | "favorites"
let currentMovies = [];      // lista da visualização atual, antes do filtro de gênero
let lastAction = null;       // ação a repetir no botão "Tentar novamente"
let selectedMovie = null;    // filme aberto no modal

// ---------- Favoritos (guardados no localStorage do navegador) ----------

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? [];
  } catch {
    return [];
  }
}

function isFavorite(id) {
  return getFavorites().some((movie) => movie.id === id);
}

function toggleFavorite(movie) {
  const favorites = getFavorites();
  const index = favorites.findIndex((item) => item.id === movie.id);

  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      genre_ids: movie.genre_ids ?? movie.genres?.map((genre) => genre.id) ?? [],
    });
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// ---------- Feedback, carregamento e estados ----------

function showFeedback(type, message, canRetry = false) {
  el.feedback.className = `alert alert-${type} d-flex align-items-center flex-wrap gap-2`;
  el.feedbackText.textContent = message;
  el.retryBtn.classList.toggle("d-none", !canRetry);
}

function hideFeedback() {
  el.feedback.classList.add("d-none");
}

function setLoading(isLoading) {
  el.loading.classList.toggle("d-none", !isLoading);
  el.searchBtn.disabled = isLoading; // evita cliques repetidos
  el.retryBtn.disabled = isLoading;
}

// Executa uma requisição mostrando carregamento e tratando qualquer falha na tela.
async function runRequest(action) {
  lastAction = action;
  hideFeedback();
  el.grid.replaceChildren();
  setLoading(true);

  try {
    await action();
  } catch (err) {
    const message = err instanceof ApiError
      ? err.message
      : "Ocorreu um erro inesperado. Tente novamente.";
    showFeedback("danger", message, true);
  } finally {
    setLoading(false);
  }
}

// ---------- Renderização ----------

function createPoster(path, title) {
  if (!path) {
    const placeholder = document.createElement("div");
    placeholder.className = "poster-placeholder";
    placeholder.textContent = "Sem pôster";
    return placeholder;
  }

  const img = document.createElement("img");
  img.className = "poster";
  img.src = TMDB_IMAGE_BASE + path;
  img.alt = `Pôster de ${title}`;
  img.loading = "lazy";
  return img;
}

function createMovieCard(movie) {
  const col = document.createElement("div");
  col.className = "col-6 col-md-4 col-lg-3";

  const card = document.createElement("article");
  card.className = "card h-100 movie-card shadow-sm";

  const body = document.createElement("div");
  body.className = "card-body d-flex flex-column";

  const title = document.createElement("h3");
  title.className = "h6 card-title";
  title.textContent = movie.title;

  const year = document.createElement("p");
  year.className = "small text-muted mb-2";
  year.textContent = movie.release_date ? movie.release_date.slice(0, 4) : "Ano desconhecido";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-primary btn-sm mt-auto";
  button.textContent = "Ver detalhes";
  button.addEventListener("click", () => openDetails(movie.id));

  body.append(title, year, button);
  card.append(createPoster(movie.poster_path, movie.title), body);
  col.append(card);
  return col;
}

// Desenha a lista atual aplicando o filtro de gênero, com aviso se ficar vazia.
function renderCurrentList() {
  const genreId = Number(el.genreSelect.value);
  const list = genreId
    ? currentMovies.filter((movie) => movie.genre_ids?.includes(genreId))
    : currentMovies;

  el.grid.replaceChildren();

  if (list.length === 0) {
    const message = genreId && currentMovies.length > 0
      ? "Nenhum filme deste gênero nesta lista. Escolha outro gênero."
      : EMPTY_MESSAGES[currentView];
    showFeedback("info", message);
    return;
  }

  hideFeedback();
  el.grid.append(...list.map(createMovieCard));
}

// ---------- Ações ----------

function loadPopular() {
  currentView = "popular";
  return runRequest(async () => {
    const data = await getPopularMovies();
    currentMovies = data.results;
    renderCurrentList();
  });
}

function searchFromForm(event) {
  event.preventDefault();
  const term = el.searchInput.value.trim();

  // Entrada inválida: valida antes de chamar a API.
  if (term.length < 2) {
    el.searchInput.classList.add("is-invalid");
    el.searchInput.focus();
    return;
  }

  el.searchInput.classList.remove("is-invalid");
  currentView = "search";
  runRequest(async () => {
    const data = await searchMovies(term);
    currentMovies = data.results;
    renderCurrentList();
  });
}

function showFavorites() {
  currentView = "favorites";
  currentMovies = getFavorites(); // favoritos ficam no navegador, sem nova chamada à API
  hideFeedback();
  renderCurrentList();
}

async function loadGenres() {
  try {
    const data = await getGenres();
    for (const genre of data.genres) {
      el.genreSelect.append(new Option(genre.name, genre.id));
    }
  } catch {
    el.genreSelect.disabled = true;
    el.genreHelp.classList.remove("d-none");
  }
}

// ---------- Modal de detalhes ----------

function createSpinner(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "text-center py-4";

  const spinner = document.createElement("div");
  spinner.className = "spinner-border text-primary";
  spinner.setAttribute("role", "status");

  const label = document.createElement("p");
  label.className = "mt-2 mb-0";
  label.textContent = text;

  wrapper.append(spinner, label);
  return wrapper;
}

function createDetailsContent(movie) {
  const row = document.createElement("div");
  row.className = "row g-3";

  const posterCol = document.createElement("div");
  posterCol.className = "col-5";
  posterCol.append(createPoster(movie.poster_path, movie.title));

  const infoCol = document.createElement("div");
  infoCol.className = "col-7";

  const facts = [
    ["Lançamento", movie.release_date || "não informado"],
    ["Duração", movie.runtime ? `${movie.runtime} min` : "não informada"],
    ["Nota média", movie.vote_average ? `${movie.vote_average.toFixed(1)} / 10` : "sem nota"],
    ["Gêneros", (movie.genres ?? []).map((genre) => genre.name).join(", ") || "não informados"],
  ];

  const list = document.createElement("dl");
  list.className = "row mb-0";
  for (const [label, value] of facts) {
    const dt = document.createElement("dt");
    dt.className = "col-5";
    dt.textContent = label;

    const dd = document.createElement("dd");
    dd.className = "col-7";
    dd.textContent = value;

    list.append(dt, dd);
  }

  const overview = document.createElement("p");
  overview.className = "mt-3 mb-0";
  overview.textContent = movie.overview || "Sinopse não disponível.";

  infoCol.append(list, overview);
  row.append(posterCol, infoCol);
  return row;
}

function updateFavButton() {
  const favorited = isFavorite(selectedMovie.id);
  el.favBtn.textContent = favorited ? "Remover dos favoritos" : "Adicionar aos favoritos";
  el.favBtn.classList.toggle("btn-warning", favorited);
  el.favBtn.classList.toggle("btn-outline-warning", !favorited);
}

async function openDetails(id) {
  selectedMovie = null;
  el.favBtn.disabled = true;
  el.modalTitle.textContent = "Carregando...";
  el.modalBody.replaceChildren(createSpinner("Carregando detalhes..."));
  bootstrap.Modal.getOrCreateInstance(el.modal).show();

  try {
    selectedMovie = await getMovieDetails(id);
    el.modalTitle.textContent = selectedMovie.title;
    el.modalBody.replaceChildren(createDetailsContent(selectedMovie));
    el.favBtn.disabled = false;
    updateFavButton();
  } catch (err) {
    el.modalTitle.textContent = "Não foi possível abrir o filme";
    const alert = document.createElement("div");
    alert.className = "alert alert-danger mb-0";
    alert.textContent = err instanceof ApiError
      ? err.message
      : "Ocorreu um erro inesperado ao carregar os detalhes.";
    el.modalBody.replaceChildren(alert);
  }
}

// ---------- Eventos e inicialização ----------

function setActiveNav(link) {
  for (const item of [el.navPopular, el.navFavorites]) {
    item.classList.toggle("active", item === link);
  }
}

function setupEvents() {
  el.searchForm.addEventListener("submit", searchFromForm);
  el.searchInput.addEventListener("input", () => el.searchInput.classList.remove("is-invalid"));
  el.genreSelect.addEventListener("change", renderCurrentList);
  el.retryBtn.addEventListener("click", () => {
    if (lastAction) runRequest(lastAction);
  });

  el.navPopular.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveNav(el.navPopular);
    loadPopular();
  });

  el.navFavorites.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveNav(el.navFavorites);
    showFavorites();
  });

  el.favBtn.addEventListener("click", () => {
    if (!selectedMovie) return;
    toggleFavorite(selectedMovie);
    updateFavButton();
    if (currentView === "favorites") showFavorites();
  });
}

function init() {
  setupEvents();
  loadGenres();
  loadPopular();
}

init();
