
import type { Document } from "mongodb";
import type { Game } from "../models/game.js";
import { connectDatabase } from "../config/database.js";
import {
  saveGameIfNotExists,
  refreshGameMetadata,
} from "../repositories/gameRepository.js";
import {
  discoverGames,
  getGameByIGDBId,
  type DiscoveryStrategy,
} from "./igdb.js";
import { normalizeIGDBGame } from "./gameService.js";

const STRATEGIES: DiscoveryStrategy[] = [
  "CATALOG",
  "RETRO_PRE_2000",
  "RETRO_2000S",
  "LOW_EXPOSURE",
  "LOW_EXPOSURE_RETRO",
  "INDIE_DISCOVERY",
  "INDIE_RETRO",
];

const PAGE_SIZE = 50;
const PAGES_PER_RUN = 2;
const SYNC_INTERVAL_MS = 30 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;
const STATE_ID = "catalog-sync";

interface SyncState extends Document {
  _id: string;
  strategyIndex?: number;
  offset?: number;
  refreshCursor?: number;
}

let started = false;

async function runCatalogSync(): Promise<void> {
  const database = await connectDatabase();
  const stateCollection =
    database.collection<SyncState>("sync_state");
  const gamesCollection = database.collection<Game>("games");

  const state = await stateCollection.findOne({
    _id: STATE_ID,
  });

  let strategyIndex =
    Number(state?.strategyIndex ?? 0) % STRATEGIES.length;
  let offset = Number(state?.offset ?? 0);

  console.log("[Catalog sync] Starting import cycle");

  // Importamos como máximo dos páginas por ciclo.
  for (let page = 0; page < PAGES_PER_RUN; page++) {
    const strategy = STRATEGIES[strategyIndex];

    const igdbGames = await discoverGames(
      strategy,
      PAGE_SIZE,
      offset,
    );

    if (igdbGames.length === 0) {
      // Esta estrategia llegó al final.
      // La próxima ejecución comenzará otra estrategia.
      strategyIndex = (strategyIndex + 1) % STRATEGIES.length;
      offset = 0;
      break;
    }

    let inserted = 0;
    let existing = 0;
    let skipped = 0;
    let failed = 0;

    const now = Math.floor(Date.now() / 1000);

    for (const igdbGame of igdbGames) {
      try {
        if (
          !igdbGame.first_release_date ||
          igdbGame.first_release_date > now
        ) {
          skipped++;
          continue;
        }

        const game = normalizeIGDBGame(igdbGame);
        const result = await saveGameIfNotExists(game);

        if (result.inserted) {
          inserted++;
        } else {
          existing++;
        }
      } catch (error) {
        failed++;
        console.error(
          `[Catalog sync] Failed to import ${igdbGame.id}:`,
          error,
        );
      }
    }

    console.log(
      `[Catalog sync] ${strategy} | offset ${offset} | ` +
      `new: ${inserted}, existing: ${existing}, ` +
      `skipped: ${skipped}, failed: ${failed}`,
    );

    offset += igdbGames.length;

    if (igdbGames.length < PAGE_SIZE) {
      strategyIndex = (strategyIndex + 1) % STRATEGIES.length;
      offset = 0;
      break;
    }

    await stateCollection.updateOne(
      { _id: STATE_ID },
      {
        $set: {
          strategyIndex,
          offset,
        },
      },
      { upsert: true },
    );
  }

  await stateCollection.updateOne(
    { _id: STATE_ID },
    {
      $set: {
        strategyIndex,
        offset,
      },
    },
    { upsert: true },
  );

  // Actualizamos un juego por ciclo para repartir las peticiones.
  const currentState = await stateCollection.findOne({
    _id: STATE_ID,
  });

  const cursor = Number(currentState?.refreshCursor ?? 0);

  let gameToRefresh = await gamesCollection.findOne(
    { igdbId: { $gt: cursor } },
    {
      sort: { igdbId: 1 },
      projection: { igdbId: 1, name: 1 },
    },
  );

  // Al llegar al final, volvemos al principio del catálogo.
  if (!gameToRefresh) {
    gameToRefresh = await gamesCollection.findOne(
      {},
      {
        sort: { igdbId: 1 },
        projection: { igdbId: 1, name: 1 },
      },
    );
  }

  if (gameToRefresh) {
    try {
      const igdbGame = await getGameByIGDBId(
        gameToRefresh.igdbId,
      );

      const now = Math.floor(Date.now() / 1000);

      if (
        igdbGame?.first_release_date &&
        igdbGame.first_release_date <= now
      ) {
        const normalized = normalizeIGDBGame(igdbGame);
        const updated = await refreshGameMetadata(normalized);

        console.log(
          `[Catalog sync] Refreshed ${gameToRefresh.name}: ` +
          `${updated ? "ok" : "not updated"}`,
        );
      } else {
        console.log(
          `[Catalog sync] Skipped refresh for ${gameToRefresh.name}: ` +
          "missing release date or not released",
        );
      }
    } catch (error) {
      console.error(
        `[Catalog sync] Failed to refresh ${gameToRefresh.name}:`,
        error,
      );
    } finally {
      await stateCollection.updateOne(
        { _id: STATE_ID },
        {
          $set: {
            refreshCursor: gameToRefresh.igdbId,
          },
        },
        { upsert: true },
      );
    }
  }

  console.log("[Catalog sync] Cycle completed");
}

async function runAndReschedule(): Promise<void> {
  try {
    await runCatalogSync();
  } catch (error) {
    console.error("[Catalog sync] Cycle failed:", error);
  } finally {
    setTimeout(() => {
      void runAndReschedule();
    }, SYNC_INTERVAL_MS);
  }
}

export function startCatalogSync(): void {
  if (started) return;

  started = true;

  console.log(
    "[Catalog sync] First cycle scheduled in 60 seconds; " +
    "subsequent cycles every 30 minutes",
  );

  setTimeout(() => {
    void runAndReschedule();
  }, FIRST_RUN_DELAY_MS);
}
