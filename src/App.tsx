import Duel from "./components/Duel";
import type { Game } from "./types/game";

const games: Game[] = [
  {
    id: 1,
    name: "Dark Souls III",
    cover: "",
    year: 2016,
    genres: ["RPG", "Action"],
    platforms: ["PC", "PlayStation 4", "Xbox One"],
    metacritic: 89,
  },
  {
    id: 2,
    name: "The Witcher 3",
    cover: "",
    year: 2015,
    genres: ["RPG"],
    platforms: ["PC", "PlayStation 4", "Xbox One"],
    metacritic: 92,
  },
  {
    id: 3,
    name: "Bloodborne",
    cover: "",
    year: 2015,
    genres: ["RPG", "Action"],
    platforms: ["PlayStation 4"],
    metacritic: 92,
  },
  {
    id: 4,
    name: "Hades",
    cover: "",
    year: 2020,
    genres: ["Action", "RPG"],
    platforms: ["PC", "Nintendo Switch"],
    metacritic: 93,
  },
  {
    id: 5,
    name: "Red Dead Redemption 2",
    cover: "",
    year: 2018,
    genres: ["Action", "Adventure"],
    platforms: ["PC", "PlayStation 4", "Xbox One"],
    metacritic: 97,
  },
  {
    id: 6,
    name: "Hollow Knight",
    cover: "",
    year: 2017,
    genres: ["Action", "Adventure"],
    platforms: ["PC", "Nintendo Switch"],
    metacritic: 90,
  },
];

function App() {
  return (
    <main>
      <h1>GAME FACE-OFF</h1>

      <p>Which game is better?</p>

      <Duel games={games} />
    </main>
  );
}

export default App;
