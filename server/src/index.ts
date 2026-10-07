import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDatabase } from "./config/database.js";
import { searchGames } from "./services/igdb.js";
import { normalizeIGDBGame } from "./services/gameService.js";

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

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Game Faceoff API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
