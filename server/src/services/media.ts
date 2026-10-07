import type { IGDBGame } from "./igdb.js";

export type IGDBImageSize =
  | "cover_small"
  | "cover_big"
  | "screenshot_med"
  | "screenshot_big"
  | "screenshot_huge"
  | "720p"
  | "1080p";

export function getIGDBImageUrl(imageId: string, size: IGDBImageSize): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export function getRandomScreenshot(game: IGDBGame): string | undefined {
  if (game.screenshots && game.screenshots.length > 0) {
    const randomIndex = Math.floor(Math.random() * game.screenshots.length);

    return getIGDBImageUrl(game.screenshots[randomIndex].image_id, "1080p");
  }

  if (game.cover) {
    return getIGDBImageUrl(game.cover.image_id, "cover_big");
  }

  return undefined;
}

export function buildGameMedia(game: IGDBGame) {
  return {
    cover: game.cover
      ? getIGDBImageUrl(game.cover.image_id, "cover_big")
      : undefined,

    screenshots: (game.screenshots ?? []).map((screenshot) =>
      getIGDBImageUrl(screenshot.image_id, "screenshot_huge"),
    ),
  };
}
