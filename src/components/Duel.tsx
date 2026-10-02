import { useEffect, useState } from "react";
import ThreeText from "./ThreeText";
import ImpactSlash from "./ImpactSlash";
import type { Game } from "../types/game";

type DuelPhase = "presenting" | "highlighting" | "impact" | "aftermath";

interface DuelProps {
  games: Game[];
}

interface DuelContext {
  title: string;
  subtitle: string;
  accent: "yellow" | "red" | "blue";
}

const duelContexts: DuelContext[] = [
  {
    title: "2017 BEST OF",
    subtitle: "Two contenders. One choice.",
    accent: "yellow",
  },
  {
    title: "RPGs FOR THE AGES",
    subtitle: "Same genre. Different legends.",
    accent: "red",
  },
  {
    title: "CLASSIC VS MODERN",
    subtitle: "Different eras. Same question.",
    accent: "blue",
  },
  {
    title: "2000s VS 2010s",
    subtitle: "Two generations collide.",
    accent: "yellow",
  },
  {
    title: "THE UNDERDOG",
    subtitle: "Can the lower-ranked game pull the upset?",
    accent: "red",
  },
];

function getRandomDuel(games: Game[]): [Game, Game] {
  const firstIndex = Math.floor(Math.random() * games.length);

  let secondIndex = Math.floor(Math.random() * games.length);

  while (secondIndex === firstIndex) {
    secondIndex = Math.floor(Math.random() * games.length);
  }

  return [games[firstIndex], games[secondIndex]];
}

function getRandomContext(): DuelContext {
  return duelContexts[Math.floor(Math.random() * duelContexts.length)];
}

function Duel({ games }: DuelProps) {
  const [duel, setDuel] = useState<[Game, Game]>(() => getRandomDuel(games));

  const [context, setContext] = useState<DuelContext>(() => getRandomContext());

  const [phase, setPhase] = useState<DuelPhase>("presenting");

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const [gameA, gameB] = duel;

  useEffect(() => {
    if (phase !== "presenting") {
      return;
    }

    const timer = setTimeout(() => {
      setPhase("highlighting");
    }, 1600);

    return () => clearTimeout(timer);
  }, [phase, duel]);

  useEffect(() => {
  if (phase !== "impact") {
    return;
  }

  const timer = setTimeout(() => {
    setPhase("aftermath");
  }, 950);

  return () => clearTimeout(timer);
}, [phase]);

  const handleGameSelect = (game: Game) => {
    if (phase === "presenting") {
      return;
    }

    if (phase === "highlighting") {
      if (selectedGame?.id === game.id) {
        setPhase("impact");
        return;
      }

      setSelectedGame(game);
    }
  };

  const handleNextDuel = () => {
    setDuel(getRandomDuel(games));
    setContext(getRandomContext());
    setSelectedGame(null);
    setPhase("presenting");
  };

  const selectedIsA = selectedGame?.id === gameA.id;
  const selectedIsB = selectedGame?.id === gameB.id;

  return (
    <section
      className={`duel-stage duel-${phase} accent-${context.accent} ${
        selectedIsA ? "selection-a" : selectedIsB ? "selection-b" : ""
      }`}
    >
      <div className="duel-background">
        <button
          className={`duel-side duel-side-a ${
            selectedIsA ? "is-selected" : ""
          } ${selectedIsB ? "is-dimmed" : ""}`}
          onClick={() => handleGameSelect(gameA)}
          aria-label={`Choose ${gameA.name}`}
        >
          <div className="duel-side-image">
            <img src={gameA.cover} alt="" />
          </div>

          <div className="duel-side-overlay" />
          <div className="duel-side-pattern" />

          <div className="duel-side-content">
            <div className="duel-side-top">
              <span className="duel-side-number">01</span>

              <span className="duel-side-category">CONTENDER</span>
            </div>

            <div className="duel-side-bottom">
              <div className="duel-side-label">
                <span>{gameA.year}</span>
                <span>/</span>
                <span>{gameA.metacritic ?? "—"} MC</span>
              </div>

              <h2>{gameA.name}</h2>

              <div className="duel-side-details">
                {gameA.genres.slice(0, 2).map((genre) => (
                  <span key={genre}>{genre}</span>
                ))}
              </div>
            </div>
          </div>
        </button>

        <button
          className={`duel-side duel-side-b ${
            selectedIsB ? "is-selected" : ""
          } ${selectedIsA ? "is-dimmed" : ""}`}
          onClick={() => handleGameSelect(gameB)}
          aria-label={`Choose ${gameB.name}`}
        >
          <div className="duel-side-image">
            <img src={gameB.cover} alt="" />
          </div>

          <div className="duel-side-overlay" />
          <div className="duel-side-pattern" />

          <div className="duel-side-content">
            <div className="duel-side-top">
              <span className="duel-side-number">02</span>

              <span className="duel-side-category">CONTENDER</span>
            </div>

            <div className="duel-side-bottom">
              <div className="duel-side-label">
                <span>{gameB.year}</span>
                <span>/</span>
                <span>{gameB.metacritic ?? "—"} MC</span>
              </div>

              <h2>{gameB.name}</h2>

              <div className="duel-side-details">
                {gameB.genres.slice(0, 2).map((genre) => (
                  <span key={genre}>{genre}</span>
                ))}
              </div>
            </div>
          </div>
        </button>
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
            {selectedGame ? (
              <>
                <strong>{selectedGame.name}</strong>
                <span>PRESS AGAIN TO CHOOSE</span>
              </>
            ) : (
              <>
                <strong>MAKE YOUR CHOICE</strong>
                <span>CHOOSE YOUR CONTENDER</span>
              </>
            )}
          </div>
        </div>
      )}

      {phase === "aftermath" && selectedGame && (
        <div className="aftermath-overlay">
          <div className="aftermath-background" />

          <div className="aftermath">
            <div className="aftermath-tag">VOTE REGISTERED</div>

            <div className="aftermath-topline">
              <span>GAME FACE-OFF</span>
              <span>RESULT / 001</span>
            </div>

            <h2>{selectedGame.name}</h2>

            <div className="aftermath-slash" />

            <p className="aftermath-main">
              You picked the community&apos;s favorite.
            </p>

            <div className="insights">
              <div className="insight">
                <strong>68%</strong>
                <span>PLAYER AGREEMENT</span>
              </div>

              <div className="insight">
                <strong>#3</strong>
                <span>AMONG RPGs</span>
              </div>

              <div className="insight">
                <strong>#7</strong>
                <span>{selectedGame.year} RELEASES</span>
              </div>

              <div className="insight">
                <strong>{selectedGame.metacritic ?? "—"}</strong>
                <span>METACRITIC</span>
              </div>
            </div>

            <button className="aftermath-dismiss" onClick={handleNextDuel}>
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
