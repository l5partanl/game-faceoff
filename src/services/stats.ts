export type GameStat = {
  id: string;
  name: string;
  cover: string;
  year: number | null;
  genres: string[];
  platforms: string[];
  votes: number;
  wins: number;
  losses: number;
  elo: number | null;
  igdbRating: number | null;
  summary: string | null;
};

const asNumber = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};
const asStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item : item?.name))
        .filter((item): item is string => Boolean(item))
    : [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unwrapGames(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  for (const value of [
    payload?.games,
    payload?.data,
    payload?.results,
    payload?.stats?.games,
    payload?.data?.games,
  ]) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeStat(game: any): GameStat {
  const community = game?.community ?? {};
  const stats = game?.stats ?? game?.community ?? {};
  return {
    id: String(game?.id ?? game?.igdbId ?? game?._id ?? ""),
    name: String(game?.name ?? "Unknown game"),
    cover: String(game?.cover ?? game?.media?.cover ?? game?.coverUrl ?? ""),
    year: asNumber(game?.year ?? game?.time?.year ?? game?.releaseYear),
    genres: asStrings(game?.genres ?? game?.dna?.genres),
    platforms: asStrings(game?.platforms ?? game?.dna?.platforms),
    votes: asNumber(community?.votes ?? stats?.votes ?? game?.votes) ?? 0,
    wins: asNumber(community?.wins ?? stats?.wins ?? game?.wins) ?? 0,
    losses: asNumber(community?.losses ?? stats?.losses ?? game?.losses) ?? 0,
    elo: asNumber(
      community?.elo ?? community?.rating ?? stats?.elo ?? game?.elo,
    ),
    igdbRating: asNumber(
      game?.igdbRating ?? game?.rating ?? game?.aggregatedRating,
    ),
summary:
  typeof game.summary === "string"
    ? game.summary
    : Array.isArray(game.summary)
      ? game.summary.join(" ")
      : null,
  };
}

export async function fetchStats(
  apiBase: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ games: GameStat[]; raw: any }> {
  const response = await fetch(`${apiBase}/api/games/stats`);
  if (!response.ok)
    throw new Error(`Stats request failed (${response.status})`);
  const raw = await response.json();
  return { games: unwrapGames(raw).map(normalizeStat), raw };
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value,
  );
}
