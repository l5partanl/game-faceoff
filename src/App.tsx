import GameCard from "./components/GameCard";
import type { Game } from "./types/game";

const gameA: Game = {
  id: 1,
  name: "Dark Souls III",
  cover: "",
  year: 2016,
  genres: ["RPG", "Action"],
  platforms: ["PC", "PlayStation 4", "Xbox One"],
  metacritic: 89,
};

const gameB: Game = {
  id: 2,
  name: "The Witcher 3",
  cover: "",
  year: 2015,
  genres: ["RPG"],
  platforms: ["PC", "PlayStation 4", "Xbox One"],
  metacritic: 92,
};

function App() {
  return (
    <main>
      <h1>GAME FACE-OFF</h1>
      <p>Which game is better?</p>

      <GameCard game={gameA} />

      <GameCard game={gameB} />
    </main>
  );
}

export default App;
