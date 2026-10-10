import { useEffect, useState } from "react";
import ThreeText from "./ThreeText";
import ImpactSlash from "./ImpactSlash";
import type { Game } from "../types/game";
import type { DuelMode } from "../services/api";
import { recordVote, type VoteGameResult } from "../services/api";

type DuelPhase = "presenting" | "highlighting" | "impact" | "aftermath";

interface DuelProps {
  duel: [Game, Game];
  mode: DuelMode;
  reason: string;
  onNextDuel: () => void;
}

interface DuelContext {
  title: string;
  subtitle: string;
  accent: "yellow" | "red" | "blue";
}

function getDuelContext(mode: DuelMode, reason: string): DuelContext {
  switch (mode) {
    case "SIMILARITY":
      return {
        title: "SAME DNA",
        subtitle: reason,
        accent: "yellow",
      };
    case "CONTRAST":
      return {
        title: "CLASH OF WORLDS",
        subtitle: reason,
        accent: "red",
      };
    case "DISCOVERY":
      return {
        title: "DISCOVERY MODE",
        subtitle: reason,
        accent: "blue",
      };
  }
}

function Duel({ duel, mode, reason, onNextDuel }: DuelProps) {
  const [phase, setPhase] = useState<DuelPhase>("presenting");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [voteResult, setVoteResult] = useState<VoteGameResult | null>(null);
  const [isSavingVote, setIsSavingVote] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const [gameA, gameB] = duel;
  const context = getDuelContext(mode, reason);

  useEffect(() => {
    if (phase !== "presenting") return;

    const timer = setTimeout(() => {
      setPhase("highlighting");
    }, 1600);

    return () => clearTimeout(timer);
  }, [phase, duel]);

  useEffect(() => {
    if (phase !== "impact") return;

    const timer = setTimeout(() => {
      setPhase("aftermath");
    }, 950);

    return () => clearTimeout(timer);
  }, [phase]);

  const handleGameSelect = (game: Game) => {
    if (phase !== "highlighting" || isSavingVote || voteResult) return;

    if (selectedGame?.id === game.id) {
      setVoteError(null);
      setIsSavingVote(true);

      void recordVote(gameA.id, gameB.id, game.id)
        .then((response) => {
          const result =
            response.result.gameA.igdbId === game.id
              ? response.result.gameA
              : response.result.gameB;

          setVoteResult(result);
          setPhase("impact");
        })
        .catch((error: unknown) => {
          console.error("Failed to record vote:", error);
          setVoteError(
            error instanceof Error
              ? error.message
              : "Could not save your vote. Please try again.",
          );
        })
        .finally(() => {
          setIsSavingVote(false);
        });

      return;
    }

    setSelectedGame(game);
    setVoteError(null);
  };

  const selectedIsA = selectedGame?.id === gameA.id;
  const selectedIsB = selectedGame?.id === gameB.id;

  const selectedStats = selectedGame ? voteResult : null;

  const renderGameImage = (game: Game) => (
    <img
      src={game.image || game.cover}
      alt=""
      onError={(event) => {
        const img = event.currentTarget;

        if (game.cover && img.src !== game.cover) {
          img.src = game.cover;
        }
      }}
    />
  );

  return (
    <section
      className={`duel-stage duel-${phase} accent-${context.accent} ${
        selectedIsA ? "selection-a" : selectedIsB ? "selection-b" : ""
      }`}
    >
      <div className="duel-background">
        {[gameA, gameB].map((game, index) => {
          const isA = index === 0;
          const isSelected = selectedGame?.id === game.id;
          const isDimmed = selectedGame !== null && !isSelected;

          return (
            <button
              key={game.id}
              className={`duel-side ${isA ? "duel-side-a" : "duel-side-b"} ${
                isSelected ? "is-selected" : ""
              } ${isDimmed ? "is-dimmed" : ""}`}
              onClick={() => handleGameSelect(game)}
              aria-label={`Choose ${game.name}`}
              disabled={
                phase !== "highlighting" || isSavingVote || !!voteResult
              }
            >
              <div className="duel-side-image">{renderGameImage(game)}</div>
              <div className="duel-side-overlay" />
              <div className="duel-side-pattern" />

              <div className="duel-side-content">
                <div className="duel-side-top">
                  <span className="duel-side-number">{isA ? "01" : "02"}</span>
                  <span className="duel-side-category">CONTENDER</span>
                </div>

                <div className="duel-side-bottom">
                  <div className="duel-side-label">
                    <span>{game.year ?? "—"}</span>
                    <span>/</span>
                    <span>{game.communityVotes} VOTES</span>
                  </div>

                  <h2>{game.name}</h2>

                  <div className="duel-side-details">
                    {game.genres.slice(0, 2).map((genre) => (
                      <span key={genre}>{genre}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {phase === "presenting" && (
        <div className="duel-presentation">
          <div className="duel-presentation-tag">
            <span>GAME FACE-OFF</span>
          </div>
          <div className="duel-presentation-title">{context.title}</div>
          <div className="duel-presentation-subtitle">{context.subtitle}</div>
          <div className="duel-presentation-lines">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      <div className="duel-cut" aria-hidden="true">
        <div className="duel-cut-line" />
        <div className="duel-cut-glow" />
        <div className="duel-vs">
          <ThreeText>VS</ThreeText>
        </div>
      </div>

      {phase === "impact" && <ImpactSlash />}

      {phase === "highlighting" && (
        <div className="duel-instruction">
          <div className="duel-instruction-box">
            {isSavingVote ? (
              <>
                <strong>SAVING YOUR VOTE...</strong>
                <span>PLEASE WAIT</span>
              </>
            ) : selectedGame ? (
              <>
                <strong>{selectedGame.name}</strong>
                <span>PRESS AGAIN TO CONFIRM</span>
              </>
            ) : (
              <>
                <strong>MAKE YOUR CHOICE</strong>
                <span>CHOOSE YOUR CONTENDER</span>
              </>
            )}
            {voteError && (
              <p role="alert">
                {voteError} Click your chosen game again to retry.
              </p>
            )}
          </div>
        </div>
      )}

      {phase === "aftermath" && selectedGame && (
        <div className="aftermath-overlay">
          <div className="aftermath-background" />

          <div className="aftermath">
            <div className="aftermath-tag">PICK CONFIRMED</div>

            <div className="aftermath-topline">
              <span>GAME FACE-OFF</span>
              <span>DUEL / {mode}</span>
            </div>

            <h2>{selectedGame.name}</h2>
            <div className="aftermath-slash" />
            <p className="aftermath-main">Your vote has been recorded.</p>

            <div className="insights">
              <div className="insight">
                <strong>
                  {selectedStats?.votes ?? selectedGame.communityVotes + 1}
                </strong>
                <span>COMMUNITY VOTES</span>
              </div>

              <div className="insight">
                <strong>{selectedStats ? selectedStats.rating : "—"}</strong>
                <span>COMMUNITY RATING</span>
              </div>

              <div className="insight">
                <strong>{selectedGame.year ?? "—"}</strong>
                <span>RELEASE YEAR</span>
              </div>

              <div className="insight">
                <strong>{selectedGame.genres[0] ?? "—"}</strong>
                <span>MAIN GENRE</span>
              </div>
            </div>

            <button className="aftermath-dismiss" onClick={onNextDuel}>
              <span>CONTINUE</span>
              <strong>→</strong>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Duel;
