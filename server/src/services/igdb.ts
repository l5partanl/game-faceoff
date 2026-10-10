interface IGDBTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface IGDBImage {
  id: number;
  image_id: string;
  url: string;
  width?: number;
  height?: number;
}

export interface IGDBNamedEntity {
  id: number;
  name: string;
  slug?: string;
}

export interface IGDBGame {
  id: number;
  name: string;
  slug?: string;
  first_release_date?: number;

  genres?: IGDBNamedEntity[];
  themes?: IGDBNamedEntity[];
  keywords?: IGDBNamedEntity[];
  game_modes?: IGDBNamedEntity[];
  player_perspectives?: IGDBNamedEntity[];
  platforms?: IGDBNamedEntity[];
  game_engines?: IGDBNamedEntity[];

  franchises?: IGDBNamedEntity[];
  collections?: IGDBNamedEntity[];

  involved_companies?: number[];

  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  aggregated_rating_count?: number;

  cover?: IGDBImage;
  artworks?: IGDBImage[];
  screenshots?: IGDBImage[];
  videos?: number[];
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("IGDB credentials are not defined");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?${params.toString()}`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `IGDB authentication failed: ${response.status} ${errorText}`,
    );
  }

  const data = (await response.json()) as IGDBTokenResponse;

  return data.access_token;
}

async function queryIGDB<T>(endpoint: string, body: string): Promise<T[]> {
  const clientId = process.env.IGDB_CLIENT_ID;

  if (!clientId) {
    throw new Error("IGDB_CLIENT_ID is not defined");
  }

  const accessToken = await getAccessToken();

  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`IGDB request failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as T[];
}

export async function searchGames(searchTerm: string): Promise<IGDBGame[]> {
  return queryIGDB<IGDBGame>(
    "games",
    `
      search "${searchTerm}";
      fields
        id,
        name,
        slug,
        first_release_date,

        genres.*,
        themes.*,
        keywords.*,
        game_modes.*,
        player_perspectives.*,
        platforms.*,
        game_engines.*,

        franchises.*,
        collections.*,

        involved_companies,

        rating,
        aggregated_rating,
        aggregated_rating_count,

        cover.*,
        artworks.*,
        screenshots.*,
        videos;

      limit 5;
    `,
  );
}

export async function getGameByIGDBId(
  igdbId: number,
): Promise<IGDBGame | null> {
  const games = await queryIGDB<IGDBGame>(
    "games",
    `
      fields
        id,
        name,
        slug,
        first_release_date,
        genres.*,
        themes.*,
        keywords.*,
        game_modes.*,
        player_perspectives.*,
        platforms.*,
        game_engines.*,
        franchises.*,
        collections.*,
        involved_companies,
        rating,
        aggregated_rating,
        aggregated_rating_count,
        cover.*,
        artworks.*,
        screenshots.*,
        videos;
      where id = ${igdbId};
      limit 1;
    `,
  );

  return games[0] ?? null;
}

export type DiscoveryStrategy =
  | "CATALOG"
  | "RETRO_PRE_2000"
  | "RETRO_2000S"
  | "LOW_EXPOSURE"
  | "LOW_EXPOSURE_RETRO";

const discoveryStrategies: Record<
  DiscoveryStrategy,
  {
    where: string;
    sort: string;
  }
> = {
  CATALOG: {
    where: "first_release_date != null & cover != null",
    sort: "first_release_date desc",
  },

  RETRO_PRE_2000: {
    where: "first_release_date < 946684800 & cover != null",
    sort: "rating_count asc",
  },

  RETRO_2000S: {
    where:
      "first_release_date >= 946684800 & first_release_date < 1262304000 & cover != null",
    sort: "rating_count asc",
  },

  LOW_EXPOSURE: {
    where: "rating_count > 0 & rating_count <= 50 & cover != null",
    sort: "rating desc",
  },

  LOW_EXPOSURE_RETRO: {
    where:
      "first_release_date < 1262304000 & rating_count > 0 & rating_count <= 50 & cover != null",
    sort: "rating desc",
  },
};

export async function discoverGames(
  strategy: DiscoveryStrategy = "CATALOG",
  limit = 20,
  offset = 0,
): Promise<IGDBGame[]> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);

  const safeOffset = Math.max(Math.floor(offset), 0);

  const config = discoveryStrategies[strategy];

  if (!config) {
    throw new Error(`Unknown discovery strategy: ${strategy}`);
  }

  return queryIGDB<IGDBGame>(
    "games",
    `
      fields
        id,
        name,
        slug,
        first_release_date,
        genres.*,
        themes.*,
        keywords.*,
        game_modes.*,
        player_perspectives.*,
        platforms.*,
        game_engines.*,
        franchises.*,
        collections.*,
        involved_companies,
        rating,
        rating_count,
        aggregated_rating,
        aggregated_rating_count,
        cover.*,
        screenshots.*;
      where ${config.where};
      sort ${config.sort};
      limit ${safeLimit};
      offset ${safeOffset};
    `,
  );
}
