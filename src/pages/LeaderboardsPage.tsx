import { useEffect, useMemo, useState } from "react";
import type { AppSection } from "../components/NavigationHub";
import { fetchStats, formatNumber, type GameStat } from "../services/stats";

type Metric = "elo" | "votes" | "wins";

type Props = {
  apiBase: string;
  onNavigate: (section: AppSection) => void;
  onSelectGame: (game: GameStat) => void;
};

export default function LeaderboardsPage({
  apiBase,
  onNavigate,
  onSelectGame,
}: Props) {
  const [games, setGames] = useState<GameStat[]>([]);
  const [metric, setMetric] = useState<Metric>("elo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetchStats(apiBase)
      .then(({ games }) => {
        if (active) setGames(games);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Unable to load leaderboard.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiBase]);

  const ranked = useMemo(
    () =>
      [...games]
        .sort((a, b) => {
          const av =
            metric === "elo"
              ? (a.elo ?? -Infinity)
              : metric === "votes"
                ? a.votes
                : a.wins;
          const bv =
            metric === "elo"
              ? (b.elo ?? -Infinity)
              : metric === "votes"
                ? b.votes
                : b.wins;
          return bv - av;
        })
        .filter((g) => metric !== "elo" || g.elo !== null)
        .slice(0, 50),
    [games, metric],
  );

  return (
    <section className="gf-page">
      <div className="gf-page-hero">
        <span className="gf-eyebrow">01 / THE PECKING ORDER</span>
        <h1>
          THE
          <br />
          <em>LEADERBOARD.</em>
        </h1>
        <p>Rankings shaped by the community, one head-to-head at a time.</p>
      </div>

      <div className="gf-page-toolbar">
        <div className="gf-tabs" role="group" aria-label="Ranking metric">
          <button
            className={metric === "elo" ? "active" : ""}
            onClick={() => setMetric("elo")}
          >
            GAME-FACEOFF RANKING
          </button>
          <button
            className={metric === "votes" ? "active" : ""}
            onClick={() => setMetric("votes")}
          >
            MOST VOTED
          </button>
          <button
            className={metric === "wins" ? "active" : ""}
            onClick={() => setMetric("wins")}
          >
            TOTAL WINS
          </button>
        </div>

        <span className="gf-page-count">{ranked.length} RESULTS / TOP 50</span>
      </div>

      {loading ? (
        <div className="gf-state">
          <div className="gf-loader" />
          <p>CALCULATING THE RANKINGS…</p>
        </div>
      ) : error ? (
        <div className="gf-empty">
          <h2>DATA CONNECTION LOST</h2>
          <p>{error}</p>
          <button onClick={() => onNavigate("duels")}>GO TO DUELS ↗</button>
        </div>
      ) : ranked.length === 0 ? (
        <div className="gf-empty">
          <h2>THE RANKING IS TAKING SHAPE.</h2>
          <p>
            There isn't enough data for this category yet. Play a few duels and
            check back.
          </p>
          <button onClick={() => onNavigate("duels")}>CAST A VOTE ↗</button>
        </div>
      ) : (
        <div className="gf-ranking-list">
          {ranked.map((game, index) => {
            const score =
              metric === "elo"
                ? game.elo === null
                  ? "—"
                  : Math.round(game.elo).toString()
                : metric === "votes"
                  ? formatNumber(game.votes)
                  : formatNumber(game.wins);

            return (
              <article
                className={`gf-rank-row ${index < 3 ? "gf-rank-podium" : ""}`}
                key={game.id || game.name}
                onClick={() => onSelectGame(game)}
                role="button"
                tabIndex={0}
                aria-label={`View information about ${game.name}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectGame(game);
                  }
                }}
              >
                <span className="gf-rank-position">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="gf-rank-cover">
                  {game.cover ? (
                    <img src={game.cover} alt="" loading="lazy" />
                  ) : (
                    <span>GF</span>
                  )}
                </div>

                <div className="gf-rank-name">
                  <strong>{game.name}</strong>
                  <span>
                    {[game.year, ...game.genres.slice(0, 2)]
                      .filter(Boolean)
                      .join(" / ") || "VIDEO GAME"}
                  </span>
                </div>

                <div className="gf-rank-score">
                  <small>
                    {metric === "elo"
                      ? "ELO SCORE"
                      : metric === "votes"
                        ? "VOTES"
                        : "WINS"}
                  </small>
                  <strong>{score}</strong>
                </div>

                <span className="gf-rank-arrow">↗</span>
              </article>
            );
          })}
        </div>
      )}

      <div className="gf-page-cta">
        <span>READY TO CHANGE THE ORDER?</span>
        <button
          className="gf-button gf-button-primary"
          onClick={() => onNavigate("duels")}
        >
          ENTER A DUEL ↗
        </button>
      </div>
    </section>
  );
}
