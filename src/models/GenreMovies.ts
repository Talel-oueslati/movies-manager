import { Movie } from "./Movie";

interface GenreMovies {
  genreId: number;
  movies: Movie[];
  page: number;
  totalPages: number;
}
