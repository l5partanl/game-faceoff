import type { Game } from "../types/game";

interface GameCardProps {
  game: Game;
}

function GameCard({ game }: GameCardProps) {
  return (
    <article>
      <h2>{game.name}</h2>
      <p>{game.year}</p>
    </article>
  );
}

export default GameCard;