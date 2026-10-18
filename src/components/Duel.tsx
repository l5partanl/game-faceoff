import { useEffect, useState } from "react";
import ThreeText from "./ThreeText";
import ImpactSlash from "./ImpactSlash";
import type { Game } from "../types/game";
import type { DuelMode } from "../services/api";
import GameInfoModal from "./GameInfoModal";
import { recordVote, type VoteGameResult } from "../services/api";

type DuelPhase = "presenting" | "highlighting" | "impact" | "aftermath";

const DUEL_TUTORIAL_SESSION_KEY = "game-faceoff-duel-tutorial-seen";

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
    case "CLASSIC_VS_MODERN":
      return {
        title: "PAST VS FUTURE",
        subtitle: reason,
        accent: "yellow",
      };

    case "UNDERDOG_VS_POPULAR":
      return {
        title: "UNDERDOG VS POPULAR",
        subtitle: reason,
        accent: "blue",
      };

    case "SAME_FRANCHISE":
      return {
        title: "FAMILY FEUD",
        subtitle: reason,
        accent: "red",
      };

    case "CRITICS_VS_COMMUNITY":
      return {
        title: "CRITICS VS PLAYERS",
        subtitle: reason,
        accent: "yellow",
      };

    case "RANDOM_CHAOS":
      return {
        title: "NO RULES",
        subtitle: reason,
        accent: "red",
      };
  }
}

function Duel({ duel, mode, reason, onNextDuel }: DuelProps) {
  const [phase, setPhase] = useState<DuelPhase>("presenting");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [voteResult, setVoteResult] = useState<VoteGameResult | null>(null);
  const [isSavingVote, setIsSavingVote] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [infoGame, setInfoGame] = useState<Game | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialChecked, setTutorialChecked] = useState(false);
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

  // Show the onboarding overlay once per browser tab session, after both games are visible.
  useEffect(() => {
    if (phase !== "highlighting" || tutorialChecked) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTutorialChecked(true);

    try {
      if (window.sessionStorage.getItem(DUEL_TUTORIAL_SESSION_KEY) !== "seen") {
        setShowTutorial(true);
      }
    } catch {
      // Keep the tutorial usable if sessionStorage is unavailable.
      setShowTutorial(true);
    }
  }, [phase, tutorialChecked]);

  const dismissTutorial = () => {
    setShowTutorial(false);

    try {
      window.sessionStorage.setItem(DUEL_TUTORIAL_SESSION_KEY, "seen");
    } catch {
      // Dismissing the overlay should still work if sessionStorage is unavailable.
    }
  };

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

      {phase === "highlighting" && (
        <>
          <button
            type="button"
            className="duel-info-button duel-info-a"
            onClick={() => setInfoGame(gameA)}
            disabled={isSavingVote}
            aria-label={`Info about ${gameA.name}`}
          >
            i
          </button>

          <button
            type="button"
            className="duel-info-button duel-info-b"
            onClick={() => setInfoGame(gameB)}
            disabled={isSavingVote}
            aria-label={`Info about ${gameB.name}`}
          >
            i
          </button>

          <button
            type="button"
            className="duel-skip-button"
            onClick={onNextDuel}
            disabled={isSavingVote}
            aria-label="Skip duel"
            title="Skip duel"
          >
            »
          </button>
        </>
      )}

      {showTutorial && phase === "highlighting" && (
        <div
          className="duel-tutorial-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="How to play Game Face-Off"
          tabIndex={0}
          onPointerDown={(event) => {
            // Capture the first touch so it dismisses the tutorial only,
            // never the game button underneath it.
            event.preventDefault();
            event.stopPropagation();
            dismissTutorial();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            dismissTutorial();
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Escape" ||
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              event.stopPropagation();
              dismissTutorial();
            }
          }}
        >
          <div className="duel-tutorial-skip" aria-hidden="true">
            <span className="duel-tutorial-arrow">↑</span>
            <span>
              <strong>SKIP</strong> — jump to another duel
            </span>
          </div>

          <div
            className="duel-tutorial-info duel-tutorial-info-a"
            aria-hidden="true"
          >
            <span className="duel-tutorial-arrow">←</span>
            <span>
              <strong>INFO</strong>
              <br />
              Game details
            </span>
          </div>
          <div
            className="duel-tutorial-info duel-tutorial-info-b"
            aria-hidden="true"
          >
            <span>
              <strong>INFO</strong>
              <br />
              Game details
            </span>
            <span className="duel-tutorial-arrow">→</span>
          </div>

          <div className="duel-tutorial-card">
            <span className="duel-tutorial-kicker">
              GAME FACE-OFF / QUICK GUIDE
            </span>
            <h2>YOUR PICK. YOUR RULES.</h2>
            <p>
              <strong>1.</strong> Tap a game to select it.
            </p>
            <p>
              <strong>2.</strong> Tap it again to confirm your vote.
            </p>
            <p>
              <strong>3.</strong> Use <b>INFO</b> for details or <b>SKIP</b> for
              another duel.
            </p>
            <span className="duel-tutorial-dismiss">
              TOUCH ANYWHERE TO START
            </span>
          </div>

          <div className="duel-tutorial-choice" aria-hidden="true">
            <span>
              <strong>CHOOSE A SIDE</strong>
              <br />
              Tap again to vote
            </span>
          </div>
        </div>
      )}

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

      <GameInfoModal game={infoGame} onClose={() => setInfoGame(null)} />
    </section>
  );
}

export default Duel;
