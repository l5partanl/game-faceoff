import type { Game } from "../types/game";

export type DuelMode = "SIMILARITY" | "CONTRAST" | "DISCOVERY";

export interface DuelData {
  mode: DuelMode;
  reason: string;
  games: [Game, Game];
}

interface BackendGame {
  igdbId: number;
  name: string;
  time?: {
    year?: number;
  };
  dna?: {
    genres?: string[];
    platforms?: string[];
  };
  media?: {
    cover?: string;
    screenshots?: string[];
  };
  community?: {
    votes?: number;
    rating?: number;
  };
}

interface BackendDuelResponse {
  status: string;
  duel: {
    mode: DuelMode;
    reason: string;
    games: [BackendGame, BackendGame];
  };
}

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

function normalizeGame(game: BackendGame): Game {
  const screenshots = game.media?.screenshots ?? [];
  const cover = game.media?.cover ?? "";

  const image =
    screenshots.length > 0
      ? screenshots[Math.floor(Math.random() * screenshots.length)]
      : cover;

  return {
    id: game.igdbId,
    name: game.name,
    image,
    cover,
    year: game.time?.year ?? null,
    genres: game.dna?.genres ?? [],
    platforms: game.dna?.platforms ?? [],
    communityVotes: game.community?.votes ?? 0,
    communityRating: game.community?.rating ?? 1500,
  };
}

export async function fetchNextDuel(
  mode: DuelMode = "SIMILARITY",
): Promise<DuelData> {
  const response = await fetch(`${API_URL}/api/duels/next?mode=${mode}`);

  if (!response.ok) {
    throw new Error(`Could not load duel (HTTP ${response.status})`);
  }

  const data: BackendDuelResponse = await response.json();

  if (
    data.status !== "ok" ||
    !data.duel ||
    !Array.isArray(data.duel.games) ||
    data.duel.games.length !== 2
  ) {
    throw new Error("The backend returned an invalid duel.");
  }

  return {
    mode: data.duel.mode,
    reason: data.duel.reason,
    games: [
      normalizeGame(data.duel.games[0]),
      normalizeGame(data.duel.games[1]),
    ],
  };
}

export interface VoteGameResult {
  igdbId: number;
  name: string;
  rating: number;
  votes: number;
  wins: number;
  losses: number;
}

export interface VoteResponse {
  status: "ok";
  message: string;
  result: {
    gameA: VoteGameResult;
    gameB: VoteGameResult;
  };
}

export async function recordVote(
  gameAId: number,
  gameBId: number,
  winnerId: number,
): Promise<VoteResponse> {
  const response = await fetch(`${API_URL}/api/duels/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gameAId,
      gameBId,
      winnerId,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.status !== "ok") {
    throw new Error(data.message ?? "Could not record vote.");
  }

  return data as VoteResponse;
}
