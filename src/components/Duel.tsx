import { useEffect, useState } from "react";
import type { Game } from "../types/game";
import GameCard from "./GameCard";

type DuelPhase = "presenting" | "highlighting" | "aftermath";

interface DuelProps {
  games: Game[];
}

interface DuelContext {
  title: string;
  subtitle: string;
}

const duelContexts: DuelContext[] = [
  {
    title: "2017 BEST OF",
    subtitle: "Two contenders from the same year",
  },
  {
    title: "RPGs FOR THE AGES",
    subtitle: "Same genre. Different legends.",
  },
  {
    title: "CLASSIC VS MODERN",
    subtitle: "Different eras. Same question.",
  },
  {
    title: "2000s VS 2010s",
    subtitle: "Which era had better games?",
  },
  {
    title: "THE UNDERDOG",
    subtitle: "Can the lower-ranked game pull the upset?",
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
    }, 1800);

    return () => clearTimeout(timer);
  }, [phase, duel]);

  const handleGameSelect = (game: Game) => {
    if (phase === "presenting") {
      return;
    }

    if (phase === "highlighting") {
      if (selectedGame?.id === game.id) {
        setPhase("aftermath");
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
    <section className={`duel-stage duel-${phase}`}>
      {phase === "presenting" && (
        <div className="duel-intro">
          <p>{context.title}</p>
          <span>{context.subtitle}</span>
        </div>
      )}

      <div className="duel">
        <div
          className={`duel-card-wrapper ${
            selectedIsA ? "is-selected" : ""
          } ${selectedIsB ? "is-dimmed" : ""}`}
        >
          <GameCard game={gameA} onSelect={() => handleGameSelect(gameA)} />
        </div>

        <div className="duel-vs">VS</div>

        <div
          className={`duel-card-wrapper ${
            selectedIsB ? "is-selected" : ""
          } ${selectedIsA ? "is-dimmed" : ""}`}
        >
          <GameCard game={gameB} onSelect={() => handleGameSelect(gameB)} />
        </div>
      </div>

      {phase === "highlighting" && selectedGame && (
        <p className="duel-hint">
          {selectedGame.name}
          <span>Tap again to choose</span>
        </p>
      )}

      {phase === "highlighting" && !selectedGame && (
        <p className="duel-hint">Choose your game</p>
      )}

      {phase === "aftermath" && selectedGame && (
        <div className="aftermath-overlay">
          <div className="aftermath">
            <p className="aftermath-label">VOTE REGISTERED</p>

            <h2>{selectedGame.name}</h2>

            <p className="aftermath-main">
              You picked the community's favorite.
            </p>

            <div className="insights">
              <div className="insight">
                <strong>68%</strong>
                <span>of players agreed with you</span>
              </div>

              <div className="insight">
                <strong>#3</strong>
                <span>among RPGs</span>
              </div>

              <div className="insight">
                <strong>#7</strong>
                <span>among {selectedGame.year} releases</span>
              </div>

              <div className="insight">
                <strong>{selectedGame.metacritic}</strong>
                <span>Metacritic</span>
              </div>
            </div>

            <button className="aftermath-dismiss" onClick={handleNextDuel}>
              Tap to continue
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Duel;
