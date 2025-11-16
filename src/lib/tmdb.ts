const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;

const headers = {
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json;charset=utf-8'
};

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface MediaDetails extends Movie, TVShow {
  genres: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
  seasons?: Array<{
    season_number: number;
    name: string;
    episode_count: number;
    air_date?: string;
    poster_path?: string;
  }>;
  networks?: Array<{ name: string; id: number }>;
  production_companies?: Array<{ name: string; id: number }>;
  original_language?: string;
  last_air_date?: string;
}

// Image URLs
export const getImageUrl = (path: string, size: string = 'original') => {
  if (!path) return '/placeholder-movie.jpg';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getPosterUrl = (path: string) => getImageUrl(path, 'w500');
export const getBackdropUrl = (path: string) => getImageUrl(path, 'original');

// Movies
export const getTrendingMovies = async (timeWindow: 'day' | 'week' = 'week') => {
  const response = await fetch(
    `${TMDB_BASE_URL}/trending/movie/${timeWindow}?language=en-US`,
    { headers }
  );
  const data = await response.json();
  return data.results as Movie[];
};

export const getPopularMovies = async (page: number = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/popular?language=en-US&page=${page}`,
    { headers }
  );
  const data = await response.json();
  return data.results as Movie[];
};

export const getTopRatedMovies = async (page: number = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/top_rated?language=en-US&page=${page}`,
    { headers }
  );
  const data = await response.json();
  return data.results as Movie[];
};

export const getUpcomingMovies = async (page: number = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/upcoming?language=en-US&page=${page}`,
    { headers }
  );
  const data = await response.json();
  return data.results as Movie[];
};

export const getNowPlayingMovies = async (page: number = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/now_playing?language=en-US&page=${page}`,
    { headers }
  );
  const data = await response.json();
  return data.results as Movie[];
};

// TV Shows
export const getTrendingTVShows = async (timeWindow: 'day' | 'week' = 'week') => {
  const response = await fetch(
    `${TMDB_BASE_URL}/trending/tv/${timeWindow}?language=en-US`,
    { headers }
  );
  const data = await response.json();
  return data.results as TVShow[];
};

export const getPopularTVShows = async (page: number = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/tv/popular?language=en-US&page=${page}`,
    { headers }
  );
  const data = await response.json();
  return data.results as TVShow[];
};

export const getTopRatedTVShows = async (page: number = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/tv/top_rated?language=en-US&page=${page}`,
    { headers }
  );
  const data = await response.json();
  return data.results as TVShow[];
};

export const getAiringTodayTVShows = async (page: number = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/tv/airing_today?language=en-US&page=${page}`,
    { headers }
  );
  const data = await response.json();
  return data.results as TVShow[];
};

export const getOnTheAirTVShows = async (page: number = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/tv/on_the_air?language=en-US&page=${page}`,
    { headers }
  );
  const data = await response.json();
  return data.results as TVShow[];
};

// Details
export const getMovieDetails = async (id: number) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${id}?language=en-US`,
    { headers }
  );
  return await response.json() as MediaDetails;
};

export const getTVShowDetails = async (id: number) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/tv/${id}?language=en-US`,
    { headers }
  );
  return await response.json() as MediaDetails;
};

// Search
export const searchMovies = async (query: string, page: number = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${page}`,
    { headers }
  );
  const data = await response.json();
  return data.results as Movie[];
};

export const searchTVShows = async (query: string, page: number = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&language=en-US&page=${page}`,
    { headers }
  );
  const data = await response.json();
  return data.results as TVShow[];
};

// Genres
export const getMovieGenres = async () => {
  const response = await fetch(
    `${TMDB_BASE_URL}/genre/movie/list?language=en-US`,
    { headers }
  );
  const data = await response.json();
  return data.genres as { id: number; name: string }[];
};

export const getTVGenres = async () => {
  const response = await fetch(
    `${TMDB_BASE_URL}/genre/tv/list?language=en-US`,
    { headers }
  );
  const data = await response.json();
  return data.genres as { id: number; name: string }[];
};
