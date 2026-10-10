import "dotenv/config";
import express from "express";
import cors from "cors";
import type { Game } from "./models/game.js";
import { client, connectDatabase } from "./config/database.js";
import { normalizeIGDBGame } from "./services/gameService.js";
import {
  saveGameIfNotExists,
  initializeGameRepository,
  refreshGameMetadata,
} from "./repositories/gameRepository.js";
import {
  discoverGames,
  searchGames,
  getGameByIGDBId,
} from "./services/igdb.js";

import { startCatalogSync } from "./services/catalogSync.js";

import { generateDuel, type DuelMode } from "./services/duelGenerator.js";

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

    const now = Math.floor(Date.now() / 1000);

    if (!igdbGame.first_release_date || igdbGame.first_release_date > now) {
      return res.status(422).json({
        status: "error",
        message:
          "Only games with a confirmed release date in the past can be imported",
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
  const limit = Number(req.body?.limit ?? 50);
  const offset = Number(req.body?.offset ?? 0);
  const maxPages = Number(req.body?.maxPages ?? 1);
  const targetNew = Number(req.body?.targetNew ?? 50);
  const strategy = req.body?.strategy ?? "CATALOG";

  const allowedStrategies = [
    "CATALOG",
    "RETRO_PRE_2000",
    "RETRO_2000S",
    "LOW_EXPOSURE",
    "LOW_EXPOSURE_RETRO",
    "INDIE_DISCOVERY",
    "INDIE_RETRO",
  ];

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    !Number.isInteger(maxPages) ||
    maxPages < 1 ||
    maxPages > 10 ||
    !Number.isInteger(targetNew) ||
    targetNew < 1 ||
    targetNew > 500 ||
    typeof strategy !== "string" ||
    !allowedStrategies.includes(strategy)
  ) {
    return res.status(400).json({
      status: "error",
      message: "Invalid discovery parameters",
      allowedStrategies,
      limits: {
        pageSize: "1-50",
        maxPages: "1-10",
        targetNew: "1-500",
      },
    });
  }

  try {
    let currentOffset = offset;
    let inserted = 0;
    let existing = 0;
    let failed = 0;
    let skippedUnreleased = 0;
    let received = 0;
    let pagesProcessed = 0;

    const pageResults: {
      offset: number;
      received: number;
      inserted: number;
      existing: number;
      failed: number;
    }[] = [];

    const currentTimestamp = Math.floor(Date.now() / 1000);

    while (pagesProcessed < maxPages && inserted < targetNew) {
      const igdbGames = await discoverGames(
        strategy as import("./services/igdb.js").DiscoveryStrategy,
        limit,
        currentOffset,
      );

      if (igdbGames.length === 0) {
        break;
      }

      const pageOffset = currentOffset;
      let pageInserted = 0;
      let pageExisting = 0;
      let pageFailed = 0;

      received += igdbGames.length;
      pagesProcessed++;

      for (const igdbGame of igdbGames) {
        try {
          // Solo guardamos juegos con fecha de lanzamiento
          // conocida y que ya hayan salido.
          if (
            !igdbGame.first_release_date ||
            igdbGame.first_release_date > currentTimestamp
          ) {
            skippedUnreleased++;
            continue;
          }

          const game = normalizeIGDBGame(igdbGame);
          const result = await saveGameIfNotExists(game);

          if (result.inserted) {
            inserted++;
            pageInserted++;
          } else {
            existing++;
            pageExisting++;
          }
        } catch (error) {
          failed++;
          pageFailed++;

          console.error(`Failed to import IGDB game ${igdbGame.id}:`, error);
        }
      }

      pageResults.push({
        offset: pageOffset,
        received: igdbGames.length,
        inserted: pageInserted,
        existing: pageExisting,
        failed: pageFailed,
      });

      currentOffset += igdbGames.length;

      if (igdbGames.length < limit) {
        break;
      }
    }

    return res.json({
      status: "ok",
      strategy,
      requestedPerPage: limit,
      targetNew,
      inserted,
      existing,
      failed,
      skippedUnreleased,
      pagesProcessed,
      received,
      startOffset: offset,
      nextOffset: currentOffset,
      targetReached: inserted >= targetNew,
      pages: pageResults,
    });
  } catch (error) {
    console.error("Game discovery failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to discover games",
    });
  }
});

app.get("/api/games/stats", async (_req, res) => {
  try {
    const database = await connectDatabase();
    const games = database.collection("games");

    const [
      total,
      decades,
      genres,
      platforms,
      withCover,
      withScreenshots,
      withIGDBRatingCount,
      withoutCommunityVotes,
    ] = await Promise.all([
      games.countDocuments(),

      games
        .aggregate([
          {
            $match: {
              "time.decade": { $exists: true },
            },
          },
          {
            $group: {
              _id: "$time.decade",
              games: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      games
        .aggregate([
          { $unwind: "$dna.genres" },
          {
            $group: {
              _id: "$dna.genres",
              games: { $sum: 1 },
            },
          },
          { $sort: { games: -1 } },
          { $limit: 15 },
        ])
        .toArray(),

      games
        .aggregate([
          { $unwind: "$dna.platforms" },
          {
            $group: {
              _id: "$dna.platforms",
              games: { $sum: 1 },
            },
          },
          { $sort: { games: -1 } },
          { $limit: 15 },
        ])
        .toArray(),

      games.countDocuments({
        "media.cover": { $exists: true, $ne: null },
      }),

      games.countDocuments({
        "media.screenshots.0": { $exists: true },
      }),

      games.countDocuments({
        "external.ratingCount": { $exists: true },
      }),

      games.countDocuments({
        "community.votes": 0,
      }),
    ]);

    return res.json({
      status: "ok",

      catalog: {
        total,
        decades,
        topGenres: genres,
        topPlatforms: platforms,
      },

      coverage: {
        withCover,
        withoutCover: total - withCover,
        withScreenshots,
        withoutScreenshots: total - withScreenshots,
        withIGDBRatingCount,
        missingIGDBRatingCount: total - withIGDBRatingCount,
      },

      community: {
        withoutVotes: withoutCommunityVotes,
        withVotes: total - withoutCommunityVotes,
      },
    });
  } catch (error) {
    console.error("Catalog statistics failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve catalog statistics",
    });
  }
});

app.post("/api/games/refresh", async (req, res) => {
  try {
    const igdbId = Number(req.body?.igdbId);

    if (!Number.isInteger(igdbId) || igdbId <= 0) {
      return res.status(400).json({
        status: "error",
        message: "A valid igdbId is required",
      });
    }

    const database = await connectDatabase();
    const existing = await database.collection("games").findOne({ igdbId });

    if (!existing) {
      return res.status(404).json({
        status: "error",
        message: "Game not found in the local catalog",
      });
    }

    const igdbGame = await getGameByIGDBId(igdbId);

    if (!igdbGame) {
      return res.status(404).json({
        status: "error",
        message: "Game not found in IGDB",
      });
    }

    const normalizedGame = normalizeIGDBGame(igdbGame);

    const updatedGame = await refreshGameMetadata(normalizedGame);

    if (!updatedGame) {
      return res.status(500).json({
        status: "error",
        message: "Failed to refresh game metadata",
      });
    }

    return res.json({
      status: "ok",
      message: "Game metadata refreshed successfully",
      game: updatedGame,
    });
  } catch (error) {
    console.error("Failed to refresh game metadata:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to refresh game metadata",
    });
  }
});

app.post("/api/games/refresh-all", async (_req, res) => {
  try {
    const database = await connectDatabase();
    const games = database.collection("games");

    const catalog = await games
      .find({}, { projection: { _id: 0, igdbId: 1, name: 1 } })
      .toArray();

    const currentTimestamp = Math.floor(Date.now() / 1000);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const errors: { igdbId: number; name: string; reason: string }[] = [];

    for (const entry of catalog) {
      try {
        const igdbGame = await getGameByIGDBId(entry.igdbId);

        if (!igdbGame) {
          failed++;
          errors.push({
            igdbId: entry.igdbId,
            name: entry.name,
            reason: "Game not found in IGDB",
          });
          continue;
        }

        // Refresh games with release dates reached.
        if (
          !igdbGame.first_release_date ||
          igdbGame.first_release_date > currentTimestamp
        ) {
          skipped++;
          continue;
        }

        const normalizedGame = normalizeIGDBGame(igdbGame);
        const result = await refreshGameMetadata(normalizedGame);

        if (result) {
          updated++;
        } else {
          failed++;
          errors.push({
            igdbId: entry.igdbId,
            name: entry.name,
            reason: "Game was not found after refresh",
          });
        }
      } catch (error) {
        failed++;
        errors.push({
          igdbId: entry.igdbId,
          name: entry.name,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return res.json({
      status: "ok",
      total: catalog.length,
      updated,
      skipped,
      failed,
      errors,
    });
  } catch (error) {
    console.error("Catalog refresh failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to refresh catalog",
    });
  }
});

app.post("/api/duels/vote", async (req, res) => {
  const gameAId = Number(req.body?.gameAId);
  const gameBId = Number(req.body?.gameBId);
  const winnerId = Number(req.body?.winnerId);

  if (
    !Number.isInteger(gameAId) ||
    gameAId <= 0 ||
    !Number.isInteger(gameBId) ||
    gameBId <= 0 ||
    !Number.isInteger(winnerId) ||
    gameAId === gameBId ||
    ![gameAId, gameBId].includes(winnerId)
  ) {
    return res.status(400).json({
      status: "error",
      message:
        "Provide two different valid game IDs and a winner ID matching one of them",
    });
  }

  const session = client.startSession();

  try {
    const database = await connectDatabase();
    const games = database.collection<Game>("games");

    let result:
      | {
          gameA: {
            igdbId: number;
            name: string;
            rating: number;
            votes: number;
            wins: number;
            losses: number;
          };
          gameB: {
            igdbId: number;
            name: string;
            rating: number;
            votes: number;
            wins: number;
            losses: number;
          };
        }
      | undefined;

    await session.withTransaction(async () => {
      const [gameA, gameB] = await Promise.all([
        games.findOne({ igdbId: gameAId }, { session }),
        games.findOne({ igdbId: gameBId }, { session }),
      ]);

      if (!gameA || !gameB) {
        throw new Error("GAME_NOT_FOUND");
      }

      const ratingA = Number(gameA.community?.rating ?? 1500);
      const ratingB = Number(gameB.community?.rating ?? 1500);

      const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

      const expectedB = 1 - expectedA;

      const actualA = winnerId === gameAId ? 1 : 0;
      const actualB = 1 - actualA;

      const kFactor = 32;

      const newRatingA = Math.round(ratingA + kFactor * (actualA - expectedA));

      const newRatingB = Math.round(ratingB + kFactor * (actualB - expectedB));

      const [updateA, updateB] = await Promise.all([
        games.updateOne(
          { igdbId: gameAId },
          {
            $inc: {
              "community.votes": 1,
              "community.wins": actualA,
              "community.losses": 1 - actualA,
            },
            $set: {
              "community.rating": newRatingA,
            },
          },
          { session },
        ),

        games.updateOne(
          { igdbId: gameBId },
          {
            $inc: {
              "community.votes": 1,
              "community.wins": actualB,
              "community.losses": 1 - actualB,
            },
            $set: {
              "community.rating": newRatingB,
            },
          },
          { session },
        ),
      ]);

      if (updateA.matchedCount !== 1 || updateB.matchedCount !== 1) {
        throw new Error("GAME_NOT_FOUND");
      }

      result = {
        gameA: {
          igdbId: gameAId,
          name: gameA.name,
          rating: newRatingA,
          votes: Number(gameA.community?.votes ?? 0) + 1,
          wins: Number(gameA.community?.wins ?? 0) + actualA,
          losses: Number(gameA.community?.losses ?? 0) + (1 - actualA),
        },
        gameB: {
          igdbId: gameBId,
          name: gameB.name,
          rating: newRatingB,
          votes: Number(gameB.community?.votes ?? 0) + 1,
          wins: Number(gameB.community?.wins ?? 0) + actualB,
          losses: Number(gameB.community?.losses ?? 0) + (1 - actualB),
        },
      };
    });

    if (!result) {
      throw new Error("VOTE_RESULT_MISSING");
    }

    return res.json({
      status: "ok",
      message: "Vote recorded successfully",
      result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "GAME_NOT_FOUND") {
      return res.status(404).json({
        status: "error",
        message: "One or both games were not found",
      });
    }

    console.error("Failed to record vote:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to record vote",
    });
  } finally {
    await session.endSession();
  }
});

app.get("/api/duels/next", async (req, res) => {
  try {
    const requestedMode = String(req.query.mode ?? "SIMILARITY").toUpperCase();

    const allowedModes: DuelMode[] = ["SIMILARITY", "CONTRAST", "DISCOVERY"];

    if (!allowedModes.includes(requestedMode as DuelMode)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid duel mode",
        allowedModes,
      });
    }

    const mode = requestedMode as DuelMode;
    const database = await connectDatabase();
    const games = database.collection<Game>("games");

    const currentDate = new Date();

    const candidates = await games
      .aggregate<Game>([
        {
          $match: {
            "time.releaseDate": { $lte: currentDate },
            "media.cover": { $exists: true, $ne: null },
          },
        },
        { $sample: { size: 40 } },
      ])
      .toArray();

    const duel = generateDuel(candidates, mode);

    if (!duel) {
      return res.status(404).json({
        status: "error",
        message: "Not enough eligible games for this duel mode",
      });
    }

    return res.json({
      status: "ok",
      duel,
    });
  } catch (error) {
    console.error("Failed to generate duel:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to generate duel",
    });
  }
});

async function startServer() {
  try {
    await connectDatabase();
    await initializeGameRepository();

    startCatalogSync();

    app.listen(PORT, () => {
      console.log(`Game Faceoff API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
