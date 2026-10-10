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
