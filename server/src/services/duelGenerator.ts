import type { Game } from "../models/game.js";

export type DuelMode =
  | "SIMILARITY"
  | "CONTRAST"
  | "DISCOVERY"
  | "CLASSIC_VS_MODERN"
  | "UNDERDOG_VS_POPULAR"
  | "SAME_FRANCHISE"
  | "CRITICS_VS_COMMUNITY"
  | "RANDOM_CHAOS";

export interface GeneratedDuel {
  mode: DuelMode;
  reason: string;
  games: [Game, Game];
}

function overlapCount(a: string[], b: string[]): number {
  const setB = new Set(b.map((value) => value.toLowerCase()));
  return a.filter((value) => setB.has(value.toLowerCase())).length;
}

function getExposure(game: Game): number {
  return game.external.ratingCount ?? 0;
}

function shareSeries(a: Game, b: Game): boolean {
  return (
    overlapCount(a.dna.franchises, b.dna.franchises) > 0 ||
    overlapCount(a.dna.collections, b.dna.collections) > 0
  );
}

function getCommunityScore(game: Game): number {
  const rating = game.community?.rating ?? 1500;

  // Convierte el Elo a una escala aproximada de 0 a 100.
  return 100 / (1 + Math.pow(10, (1500 - rating) / 400));
}

function isClassic(game: Game): boolean {
  return game.time.decade !== undefined && game.time.decade <= 2000;
}

function isModern(game: Game): boolean {
  return game.time.decade !== undefined && game.time.decade >= 2010;
}

function scorePair(a: Game, b: Game, mode: DuelMode): number {
  const sharedGenres = overlapCount(a.dna.genres, b.dna.genres);
  const sharedThemes = overlapCount(a.dna.themes, b.dna.themes);
  const sharedStyles = overlapCount(a.dna.styles, b.dna.styles);
  const sharedPlatforms = overlapCount(a.dna.platforms, b.dna.platforms);

  const decadeA = a.time.decade;
  const decadeB = b.time.decade;

  const decadeDifference =
    decadeA !== undefined && decadeB !== undefined
      ? Math.abs(decadeA - decadeB)
      : 0;

  const exposureA = getExposure(a);
  const exposureB = getExposure(b);
  const exposureGap = Math.abs(Math.log1p(exposureA) - Math.log1p(exposureB));

  if (mode === "SIMILARITY") {
    return (
      sharedGenres * 4 +
      sharedThemes * 2 +
      sharedStyles * 3 +
      sharedPlatforms * 0.5 +
      Math.random()
    );
  }

  if (mode === "CONTRAST") {
    return (
      sharedGenres * 2 +
      Math.min(decadeDifference / 10, 4) * 2 +
      (sharedStyles === 0 ? 2 : 0) +
      (sharedPlatforms === 0 ? 1 : 0) +
      Math.random()
    );
  }

  if (mode === "DISCOVERY" || mode === "UNDERDOG_VS_POPULAR") {
    return exposureGap * 3 + sharedGenres * 1.5 + sharedThemes + Math.random();
  }

  if (mode === "CLASSIC_VS_MODERN") {
    return decadeDifference + sharedGenres + Math.random();
  }

  if (mode === "SAME_FRANCHISE") {
    return (
      overlapCount(a.dna.franchises, b.dna.franchises) * 5 +
      overlapCount(a.dna.collections, b.dna.collections) * 4 +
      sharedGenres +
      Math.random()
    );
  }

  if (mode === "CRITICS_VS_COMMUNITY") {
    const divergenceA = (a.external.rating ?? 50) - getCommunityScore(a);
    const divergenceB = (b.external.rating ?? 50) - getCommunityScore(b);

    return Math.abs(divergenceA - divergenceB) + Math.random();
  }

  return Math.random();
}

function getReason(a: Game, b: Game, mode: DuelMode): string {
  if (mode === "DISCOVERY" || mode === "UNDERDOG_VS_POPULAR") {
    const lesserKnown = getExposure(a) <= getExposure(b) ? a : b;
    const betterKnown = lesserKnown === a ? b : a;

    return `${lesserKnown.name} faces the more widely rated ${betterKnown.name}`;
  }

  if (mode === "CLASSIC_VS_MODERN") {
    const classic = isClassic(a) ? a : b;
    const modern = classic === a ? b : a;

    return `Classic vs modern: ${classic.name} vs ${modern.name}`;
  }

  if (mode === "SAME_FRANCHISE") {
    const franchise = a.dna.franchises.find((value) =>
      b.dna.franchises.some(
        (other) => other.toLowerCase() === value.toLowerCase(),
      ),
    );

    const collection = a.dna.collections.find((value) =>
      b.dna.collections.some(
        (other) => other.toLowerCase() === value.toLowerCase(),
      ),
    );

    return `Face-off within ${franchise ?? collection ?? "the same series"}`;
  }

  if (mode === "CRITICS_VS_COMMUNITY") {
    return "Do IGDB ratings match the Game Faceoff community?";
  }

  if (mode === "RANDOM_CHAOS") {
    return "Anything can happen in this matchup";
  }

  if (mode === "CONTRAST") {
    if (
      a.time.decade !== undefined &&
      b.time.decade !== undefined &&
      a.time.decade !== b.time.decade
    ) {
      return `Different eras: ${a.time.decade}s vs ${b.time.decade}s`;
    }

    return "A contrast in style, platforms or themes";
  }

  const sharedGenres = a.dna.genres.filter((genre) =>
    b.dna.genres.some((other) => other.toLowerCase() === genre.toLowerCase()),
  );

  return sharedGenres.length > 0
    ? `Shared genre: ${sharedGenres.slice(0, 2).join(", ")}`
    : "Similar themes or game DNA";
}

function isEligiblePair(a: Game, b: Game, mode: DuelMode): boolean {
  if (a.igdbId === b.igdbId) return false;

  if (mode === "DISCOVERY" || mode === "UNDERDOG_VS_POPULAR") {
    return getExposure(a) !== getExposure(b);
  }

  if (mode === "CLASSIC_VS_MODERN") {
    return (isClassic(a) && isModern(b)) || (isClassic(b) && isModern(a));
  }

  if (mode === "SAME_FRANCHISE") {
    return shareSeries(a, b);
  }

  if (mode === "CRITICS_VS_COMMUNITY") {
    return a.external.rating !== undefined && b.external.rating !== undefined;
  }

  return true;
}

export function generateDuel(
  candidates: Game[],
  mode: DuelMode,
): GeneratedDuel | null {
  if (candidates.length < 2) return null;

  let bestPair: [Game, Game] | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];

      if (!isEligiblePair(a, b, mode)) continue;

      if (mode === "SIMILARITY" && shareSeries(a, b)) continue;

      const score = scorePair(a, b, mode);

      if (score > bestScore) {
        bestScore = score;
        bestPair = [a, b];
      }
    }
  }

  // Similarity can fall back to games in the same series.
  if (!bestPair && mode === "SIMILARITY") {
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i];
        const b = candidates[j];

        if (a.igdbId === b.igdbId) continue;

        const score = scorePair(a, b, mode);

        if (score > bestScore) {
          bestScore = score;
          bestPair = [a, b];
        }
      }
    }
  }

  if (!bestPair) return null;

  return {
    mode,
    reason: getReason(bestPair[0], bestPair[1], mode),
    games: bestPair,
  };
}
