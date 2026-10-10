export interface Game {
  id: number;
  name: string;
  image: string;
  cover: string;
  year: number | null;
  genres: string[];
  platforms: string[];
  communityVotes: number;
  communityRating: number;
}
