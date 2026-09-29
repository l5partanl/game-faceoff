import type { Game } from "../types/game";

interface GameCardProps {
  game: Game;
  onSelect: () => void;
}

function GameCard({ game, onSelect }: GameCardProps) {
  return (
<article className="game-card" onClick={onSelect}>
      <h2>{game.name}</h2>
      <p>{game.year}</p>
    </article>
  );
}

export default GameCard;