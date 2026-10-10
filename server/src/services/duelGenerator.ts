import type { Game } from "../models/game.js";

export type DuelMode = "SIMILARITY" | "CONTRAST" | "DISCOVERY";

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

  const exposureA = getExposure(a);
  const exposureB = getExposure(b);

  const lowExposure = Math.min(exposureA, exposureB);
  const highExposure = Math.max(exposureA, exposureB);
  const exposureGap = Math.log1p(highExposure) - Math.log1p(lowExposure);

  return exposureGap * 3 + sharedGenres * 1.5 + sharedThemes + Math.random();
}

function getReason(a: Game, b: Game, mode: DuelMode): string {
  if (mode === "DISCOVERY") {
    const lesserKnown = getExposure(a) <= getExposure(b) ? a : b;

    return `${lesserKnown.name} gets a chance against a game with a different exposure level`;
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

function findBestPair(
  candidates: Game[],
  mode: DuelMode,
  excludeSameSeries: boolean,
): [Game, Game] | null {
  let bestPair: [Game, Game] | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];

      if (a.igdbId === b.igdbId) continue;

      if (mode === "DISCOVERY" && getExposure(a) === getExposure(b)) {
        continue;
      }

      if (excludeSameSeries && shareSeries(a, b)) {
        continue;
      }

      const score = scorePair(a, b, mode);

      if (score > bestScore) {
        bestScore = score;
        bestPair = [a, b];
      }
    }
  }

  return bestPair;
}

export function generateDuel(
  candidates: Game[],
  mode: DuelMode,
): GeneratedDuel | null {
  if (candidates.length < 2) return null;

  // Similarity: first try pairs from different franchises and collections.
  let bestPair = findBestPair(candidates, mode, mode === "SIMILARITY");

  // Fallback: if no valid alternative exists, allow the same series.
  if (!bestPair && mode === "SIMILARITY") {
    bestPair = findBestPair(candidates, mode, false);
  }

  if (!bestPair) return null;

  return {
    mode,
    reason: getReason(bestPair[0], bestPair[1], mode),
    games: bestPair,
  };
}
