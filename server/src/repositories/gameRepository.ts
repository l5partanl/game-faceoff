import { type Collection } from "mongodb";

import { connectDatabase } from "../config/database.js";
import type { Game } from "../models/game.js";

async function getGameCollection(): Promise<Collection<Game>> {
  const database = await connectDatabase();

  return database.collection<Game>("games");
}

export async function initializeGameRepository(): Promise<void> {
  const games = await getGameCollection();

  await games.createIndex(
    { igdbId: 1 },
    { unique: true, name: "unique_igdb_id" },
  );

  console.log("Game repository initialized");
}

export async function findGameByIGDBId(igdbId: number): Promise<Game | null> {
  const games = await getGameCollection();

  return games.findOne({ igdbId });
}

export async function saveGameIfNotExists(
  game: Game,
): Promise<{ game: Game; inserted: boolean }> {
  const games = await getGameCollection();

  const result = await games.updateOne(
    { igdbId: game.igdbId },
    {
      $setOnInsert: game,
    },
    { upsert: true },
  );

  const savedGame = await games.findOne({
    igdbId: game.igdbId,
  });

  if (!savedGame) {
    throw new Error("Game was not found after saving");
  }

  return {
    game: savedGame,
    inserted: result.upsertedCount > 0,
  };
}
