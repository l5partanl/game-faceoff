import Duel from "./components/Duel";
import type { Game } from "./types/game";

const games: Game[] = [
  {
    id: 1,
    name: "Dark Souls III",
    cover: "/images/dark-souls-3.jpg",
    year: 2016,
    genres: ["RPG", "Action"],
    platforms: ["PC", "PlayStation 4", "Xbox One"],
    metacritic: 89,
  },
  {
    id: 2,
    name: "The Witcher 3",
    cover: "/images/witcher-3.jpg",
    year: 2015,
    genres: ["RPG"],
    platforms: ["PC", "PlayStation 4", "Xbox One"],
    metacritic: 92,
  },
  {
    id: 3,
    name: "Bloodborne",
    cover: "/images/bloodborne.jpg",
    year: 2015,
    genres: ["RPG", "Action"],
    platforms: ["PlayStation 4"],
    metacritic: 92,
  },
  {
    id: 4,
    name: "Hades",
    cover: "/images/hades.jpg",
    year: 2020,
    genres: ["Action", "RPG"],
    platforms: ["PC", "Nintendo Switch"],
    metacritic: 93,
  },
  {
    id: 5,
    name: "Red Dead Redemption 2",
    cover: "/images/red-dead-redemption-2.jpg",
    year: 2018,
    genres: ["Action", "Adventure"],
    platforms: ["PC", "PlayStation 4", "Xbox One"],
    metacritic: 97,
  },
  {
    id: 6,
    name: "Hollow Knight",
    cover: "/images/hollow-knight.jpg",
    year: 2017,
    genres: ["Action", "Adventure"],
    platforms: ["PC", "Nintendo Switch"],
    metacritic: 90,
  },
];

function App() {
  return <Duel games={games} />;
}

export default App;
