interface IGDBTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface IGDBGame {
  id: number;
  name: string;
  first_release_date?: number;
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
    }
  );

  if (!response.ok) {
    throw new Error(`IGDB authentication failed: ${response.status}`);
  }

  const data = (await response.json()) as IGDBTokenResponse;

  return data.access_token;
}

export async function searchGames(searchTerm: string): Promise<IGDBGame[]> {
  const clientId = process.env.IGDB_CLIENT_ID;

  if (!clientId) {
    throw new Error("IGDB_CLIENT_ID is not defined");
  }

  const accessToken = await getAccessToken();

  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    body: `
      search "${searchTerm}";
      fields id, name, first_release_date;
      limit 5;
    `,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `IGDB games request failed: ${response.status} ${errorText}`
    );
  }

  return (await response.json()) as IGDBGame[];
}