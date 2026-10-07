export interface GameTime {
  releaseDate?: Date;
  year?: number;
  decade?: number;
}

export interface GameDNA {
  genres: string[];
  themes: string[];
  keywords: string[];

  platforms: string[];

  gameModes: string[];
  perspectives: string[];

  styles: string[];

  technologies: string[];

  franchises: string[];
  collections: string[];
}

export interface GameMedia {
  cover?: string;
  screenshots: string[];
}

export interface GameExternal {
  igdbId: number;
  rating?: number;
  aggregatedRating?: number;
  aggregatedRatingCount?: number;
}

export interface GameCommunity {
  votes: number;
  wins: number;
  losses: number;
  rating: number;
}

export interface Game {
  igdbId: number;

  name: string;
  slug: string;

  time: GameTime;

  dna: GameDNA;

  media: GameMedia;

  external: GameExternal;

  community: GameCommunity;
}
