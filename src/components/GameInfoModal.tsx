import type { Game } from "../types/game";

interface GameInfoModalProps {
  game:
    | (Pick<Game, "name" | "year" | "genres"> & {
        cover?: string;
        image?: string;
        summary?: string | null;
        platforms?: string[];
      })
    | null;
  onClose: () => void;
}

export default function GameInfoModal({ game, onClose }: GameInfoModalProps) {
  if (!game) return null;

  return (
    <div className="duel-info-overlay" role="presentation" onClick={onClose}>
      <section
        className="duel-info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duel-info-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="duel-info-close"
          onClick={onClose}
          aria-label="Close game information"
        >
          ×
        </button>

        <div className="duel-info-image">
          <img
            src={game.cover || game.image || ""}
            alt={`Cover of ${game.name}`}
          />
        </div>

        <div className="duel-info-content">
          <span className="duel-info-eyebrow">GAME FILE / IGDB</span>

          <h2 id="duel-info-title">{game.name}</h2>

          <p className="duel-info-meta">
            {game.year ?? "Release year unknown"}
            {game.genres.length > 0 ? ` · ${game.genres.join(", ")}` : ""}
          </p>

          {game.platforms && game.platforms.length > 0 && (
            <div className="duel-info-platforms">
              {game.platforms.map((platform) => (
                <span key={platform} className="duel-info-platform">
                  {platform}
                </span>
              ))}
            </div>
          )}

          <p className="duel-info-summary">
            {game.summary?.trim() ||
              "No synopsis is available for this game yet."}
          </p>

          <button type="button" className="duel-info-back" onClick={onClose}>
            BACK
          </button>
        </div>
      </section>
    </div>
  );
}
