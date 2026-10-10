import type { IGDBGame } from "./igdb.js";
import { buildGameMedia } from "./media.js";
import type { Game, GameDNA, GameTime } from "../models/game.js";

function getGameTime(firstReleaseDate?: number): GameTime {
  if (!firstReleaseDate) {
    return {};
  }

  const releaseDate = new Date(firstReleaseDate * 1000);
  const year = releaseDate.getUTCFullYear();

  return {
    releaseDate,
    year,
    decade: Math.floor(year / 10) * 10,
  };
}

function getNames(entities?: { name: string }[]): string[] {
  return (entities ?? []).map((entity) => entity.name).filter(Boolean);
}

function deriveStyles(game: IGDBGame): string[] {
  const styles = new Set<string>();

  const keywords = getNames(game.keywords).map((keyword) =>
    keyword.toLowerCase(),
  );

  for (const keyword of keywords) {
    if (keyword.includes("pixel art")) {
      styles.add("PIXEL_ART");
    }

    if (keyword.includes("low poly")) {
      styles.add("LOW_POLY");
    }

    if (keyword.includes("anime")) {
      styles.add("ANIME");
    }

    if (keyword.includes("cel shaded") || keyword.includes("cel-shaded")) {
      styles.add("CEL_SHADED");
    }

    if (keyword.includes("hand drawn")) {
      styles.add("HAND_DRAWN");
    }

    if (keyword.includes("voxel")) {
      styles.add("VOXEL");
    }
  }

  return [...styles];
}

function buildGameDNA(game: IGDBGame): GameDNA {
  return {
    genres: getNames(game.genres),

    themes: getNames(game.themes),

    keywords: getNames(game.keywords),

    platforms: getNames(game.platforms),

    gameModes: getNames(game.game_modes),

    perspectives: getNames(game.player_perspectives),

    styles: deriveStyles(game),

    technologies: getNames(game.game_engines),

    franchises: getNames(game.franchises),

    collections: getNames(game.collections),
  };
}

export function normalizeIGDBGame(game: IGDBGame): Game {
  return {
    igdbId: game.id,

    name: game.name,

    slug: game.slug ?? "",

    time: getGameTime(game.first_release_date),

    dna: buildGameDNA(game),

    media: buildGameMedia(game),

    external: {
      igdbId: game.id,
      rating: game.rating,
      ratingCount: game.rating_count,
      aggregatedRating: game.aggregated_rating,
      aggregatedRatingCount: game.aggregated_rating_count,
    },

    community: {
      votes: 0,
      wins: 0,
      losses: 0,
      rating: 1500,
    },
  };
}
