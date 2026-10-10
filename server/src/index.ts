import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDatabase } from "./config/database.js";
import { normalizeIGDBGame } from "./services/gameService.js";
import { saveGameIfNotExists } from "./repositories/gameRepository.js";
import { initializeGameRepository } from "./repositories/gameRepository.js";
import { discoverGames, searchGames, getGameByIGDBId } from "./services/igdb.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Game Faceoff API is running",
  });
});

app.get("/api/igdb/test", async (_req, res) => {
  try {
    const games = await searchGames("Castlevania Symphony of the Night");

    const normalizedGames = games.map(normalizeIGDBGame);

    res.json({
      status: "ok",
      results: normalizedGames,
    });
  } catch (error) {
    console.error("IGDB test failed:", error);

    res.status(500).json({
      status: "error",
      message: "IGDB request failed",
    });
  }
});

app.post("/api/games/import", async (req, res) => {
  const igdbId = Number(req.body?.igdbId);

  if (!Number.isInteger(igdbId) || igdbId <= 0) {
    return res.status(400).json({
      status: "error",
      message: "A valid igdbId is required",
    });
  }

  try {
    const igdbGame = await getGameByIGDBId(igdbId);

    if (!igdbGame) {
      return res.status(404).json({
        status: "error",
        message: "Game not found in IGDB",
      });
    }

    const normalizedGame = normalizeIGDBGame(igdbGame);

    const result = await saveGameIfNotExists(normalizedGame);

    return res.status(result.inserted ? 201 : 200).json({
      status: "ok",
      message: result.inserted
        ? "Game imported successfully"
        : "Game already exists",
      inserted: result.inserted,
      game: result.game,
    });
  } catch (error) {
    console.error("Game import failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to import game",
    });
  }
});

app.post("/api/games/discover", async (req, res) => {
  const limit = Number(req.body?.limit ?? 20);
  const offset = Number(req.body?.offset ?? 0);
  const strategy = req.body?.strategy ?? "CATALOG";

  const allowedStrategies = [
    "CATALOG",
    "RETRO_PRE_2000",
    "RETRO_2000S",
    "LOW_EXPOSURE",
    "LOW_EXPOSURE_RETRO",
  ];

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    typeof strategy !== "string" ||
    !allowedStrategies.includes(strategy)
  ) {
    return res.status(400).json({
      status: "error",
      message: "Invalid discovery strategy, limit or offset",
      allowedStrategies,
    });
  }

  try {
    const igdbGames = await discoverGames(
      strategy as import("./services/igdb.js").DiscoveryStrategy,
      limit,
      offset,
    );

    let inserted = 0;
    let existing = 0;
    let failed = 0;

    for (const igdbGame of igdbGames) {
      try {
        const game = normalizeIGDBGame(igdbGame);
        const result = await saveGameIfNotExists(game);

        if (result.inserted) {
          inserted++;
        } else {
          existing++;
        }
      } catch (error) {
        failed++;

        console.error(`Failed to import IGDB game ${igdbGame.id}:`, error);
      }
    }

    return res.json({
      status: "ok",
      strategy,
      requested: limit,
      received: igdbGames.length,
      inserted,
      existing,
      failed,
      nextOffset: offset + igdbGames.length,
    });
  } catch (error) {
    console.error("Game discovery failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to discover games",
    });
  }
});

async function startServer() {
  try {
    await connectDatabase();
    await initializeGameRepository();

    app.listen(PORT, () => {
      console.log(`Game Faceoff API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
