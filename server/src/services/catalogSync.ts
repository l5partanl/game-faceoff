import type { Collection, Document } from "mongodb";
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
const REFRESH_PER_RUN = 10;

const SYNC_INTERVAL_MS = 30 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;
const STATE_ID = "catalog-sync";

interface SyncState extends Document {
  _id: string;
  strategyIndex?: number;
  offset?: number;
  refreshCursor?: number;
}

interface CatalogEntry {
  igdbId: number;
  name: string;
}

let started = false;
let running = false;

async function importCatalogPages(
  stateCollection: Collection<SyncState>,
): Promise<void> {
  const state = await stateCollection.findOne({ _id: STATE_ID });

  let strategyIndex = Number(state?.strategyIndex ?? 0) % STRATEGIES.length;
  let offset = Number(state?.offset ?? 0);

  console.log("[Catalog sync] Starting catalog import");

  for (let page = 0; page < PAGES_PER_RUN; page++) {
    const strategy = STRATEGIES[strategyIndex];
    const igdbGames = await discoverGames(strategy, PAGE_SIZE, offset);

    if (igdbGames.length === 0) {
      strategyIndex = (strategyIndex + 1) % STRATEGIES.length;
      offset = 0;

      console.log(
        `[Catalog sync] ${strategy} exhausted; moving to ${STRATEGIES[strategyIndex]}`,
      );
      break;
    }

    let inserted = 0;
    let existing = 0;
    let skipped = 0;
    let failed = 0;

    const now = Math.floor(Date.now() / 1000);

    for (const igdbGame of igdbGames) {
      try {
        if (!igdbGame.first_release_date || igdbGame.first_release_date > now) {
          skipped++;
          continue;
        }

        const normalizedGame = normalizeIGDBGame(igdbGame);
        const result = await saveGameIfNotExists(normalizedGame);

        if (result.inserted) {
          inserted++;
        } else {
          existing++;
        }
      } catch (error) {
        failed++;
        console.error(
          `[Catalog sync] Failed to import IGDB ${igdbGame.id}:`,
          error,
        );
      }
    }

    console.log(
      `[Catalog sync] ${strategy} | offset ${offset} | new: ${inserted}, existing: ${existing}, skipped: ${skipped}, failed: ${failed}`,
    );

    offset += igdbGames.length;

    if (igdbGames.length < PAGE_SIZE) {
      strategyIndex = (strategyIndex + 1) % STRATEGIES.length;
      offset = 0;

      console.log(
        `[Catalog sync] Page ended; next strategy: ${STRATEGIES[strategyIndex]}`,
      );
      break;
    }

    await stateCollection.updateOne(
      { _id: STATE_ID },
      { $set: { strategyIndex, offset } },
      { upsert: true },
    );
  }

  await stateCollection.updateOne(
    { _id: STATE_ID },
    { $set: { strategyIndex, offset } },
    { upsert: true },
  );
}

async function refreshExistingGames(
  stateCollection: Collection<SyncState>,
): Promise<void> {
  const database = await connectDatabase();
  const gamesCollection = database.collection<Game>("games");

  const state = await stateCollection.findOne({ _id: STATE_ID });
  let cursor = Number(state?.refreshCursor ?? 0);

  const total = await gamesCollection.countDocuments();

  if (total === 0) {
    console.log("[Catalog sync] No existing games to refresh");
    return;
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const now = Math.floor(Date.now() / 1000);

  for (let attempt = 0; attempt < REFRESH_PER_RUN; attempt++) {
    let entry = (await gamesCollection.findOne(
      { igdbId: { $gt: cursor } },
      {
        sort: { igdbId: 1 },
        projection: { _id: 0, igdbId: 1, name: 1 },
      },
    )) as CatalogEntry | null;

    if (!entry) {
      cursor = 0;

      entry = (await gamesCollection.findOne(
        { igdbId: { $gt: cursor } },
        {
          sort: { igdbId: 1 },
          projection: { _id: 0, igdbId: 1, name: 1 },
        },
      )) as CatalogEntry | null;
    }

    if (!entry) break;

    cursor = entry.igdbId;

    try {
      const igdbGame = await getGameByIGDBId(entry.igdbId);

      if (!igdbGame) {
        skipped++;
        console.warn(
          `[Catalog sync] Game not found in IGDB: ${entry.name} (${entry.igdbId})`,
        );
        continue;
      }

      if (!igdbGame.first_release_date || igdbGame.first_release_date > now) {
        skipped++;
        continue;
      }

      const normalizedGame = normalizeIGDBGame(igdbGame);
      const result = await refreshGameMetadata(normalizedGame);

      if (result) {
        updated++;
        console.log(`[Catalog sync] Refreshed ${entry.name} (${entry.igdbId})`);
      } else {
        failed++;
        console.error(
          `[Catalog sync] Local game missing after refresh: ${entry.name} (${entry.igdbId})`,
        );
      }
    } catch (error) {
      failed++;
      console.error(
        `[Catalog sync] Failed to refresh ${entry.name} (${entry.igdbId}):`,
        error,
      );
    } finally {
      await stateCollection.updateOne(
        { _id: STATE_ID },
        { $set: { refreshCursor: cursor } },
        { upsert: true },
      );
    }
  }

  console.log(
    `[Catalog sync] Refresh finished | updated: ${updated}, skipped: ${skipped}, failed: ${failed}`,
  );
}

async function runCatalogSync(): Promise<void> {
  if (running) {
    console.log("[Catalog sync] Previous cycle still running; skipping");
    return;
  }

  running = true;

  try {
    const database = await connectDatabase();
    const stateCollection = database.collection<SyncState>("sync_state");

    console.log("[Catalog sync] Cycle started");

    await importCatalogPages(stateCollection);
    await refreshExistingGames(stateCollection);

    console.log("[Catalog sync] Cycle completed");
  } finally {
    running = false;
  }
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
    "[Catalog sync] First cycle in 60 seconds; then every 30 minutes",
  );

  setTimeout(() => {
    void runAndReschedule();
  }, FIRST_RUN_DELAY_MS);
}
