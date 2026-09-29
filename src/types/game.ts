export interface Game {
  id: number;
  name: string;
  cover: string;
  year: number;
  genres: string[];
  platforms: string[];
  metacritic: number | null;
}