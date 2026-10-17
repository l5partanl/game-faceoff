import { useEffect, useMemo, useState } from "react";
import type { AppSection } from "../components/NavigationHub";
import { fetchStats, formatNumber, type GameStat } from "../services/stats";

type Props = { apiBase: string; onNavigate: (section: AppSection) => void };

export default function InsightsPage({ apiBase, onNavigate }: Props) {
  const [games, setGames] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchStats(apiBase).then(({ games }) => { if (active) setGames(games); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load insights."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [apiBase]);

  const insights = useMemo(() => {
    const genreMap = new Map<string, { games: number; votes: number; wins: number }>();
    const decadeMap = new Map<string, { games: number; votes: number; wins: number }>();
    const platformMap = new Map<string, { games: number; votes: number }>();
    for (const game of games) {
      for (const genre of game.genres) {
        const key = genre.trim();
        if (!key) continue;
        const item = genreMap.get(key) ?? { games: 0, votes: 0, wins: 0 };
        item.games += 1; item.votes += game.votes; item.wins += game.wins; genreMap.set(key, item);
      }
      if (game.year && game.year > 1970 && game.year <= new Date().getFullYear()) {
        const decade = `${Math.floor(game.year / 10) * 10}s`;
        const item = decadeMap.get(decade) ?? { games: 0, votes: 0, wins: 0 };
        item.games += 1; item.votes += game.votes; item.wins += game.wins; decadeMap.set(decade, item);
      }
      for (const platform of game.platforms) {
        const key = platform.trim();
        if (!key) continue;
        const item = platformMap.get(key) ?? { games: 0, votes: 0 };
        item.games += 1; item.votes += game.votes; platformMap.set(key, item);
      }
    }
    const sortByVotes = <T extends { votes: number }>(map: Map<string, T>) =>
      [...map.entries()].filter(([, value]) => value.votes > 0).sort((a, b) => b[1].votes - a[1].votes);
    return {
      genres: sortByVotes(genreMap).slice(0, 6),
      decades: sortByVotes(decadeMap).slice(0, 6),
      platforms: sortByVotes(platformMap).slice(0, 6),
      totalVotes: games.reduce((sum, game) => sum + game.votes, 0),
      gamesWithVotes: games.filter((game) => game.votes > 0).length,
    };
  }, [games]);

  return <section className="gf-page">
    <div className="gf-page-hero"><span className="gf-eyebrow">03 / PATTERNS IN PLAY</span><h1>READ THE<br /><em>META.</em></h1><p>What the aggregated numbers can tell us about the games getting picked.</p></div>
    {loading ? <div className="gf-state"><div className="gf-loader" /><p>FINDING THE PATTERNS…</p></div> :
      error ? <div className="gf-empty"><h2>DATA CONNECTION LOST</h2><p>{error}</p><button onClick={() => onNavigate("duels")}>GO TO DUELS ↗</button></div> :
      <><div className="gf-insights-summary"><span className="gf-eyebrow">CURRENT DATASET</span><strong>{formatNumber(insights.totalVotes)} <small>AGGREGATED VOTES</small></strong><p>Insights are calculated from game-level aggregate statistics. A category with no recorded votes is not presented as a community preference.</p></div>
        <div className="gf-insight-columns">
          <InsightColumn index="01" title="GENRE SIGNAL" subtitle="Genres represented by the most recorded votes" rows={insights.genres.map(([name, value]) => ({ name, detail: `${value.games} games`, votes: value.votes }))} />
          <InsightColumn index="02" title="TIME CAPSULE" subtitle="Release decades represented by the most votes" rows={insights.decades.map(([name, value]) => ({ name, detail: `${value.games} games`, votes: value.votes }))} />
          <InsightColumn index="03" title="PLATFORM PULSE" subtitle="Platforms represented by the most recorded votes" rows={insights.platforms.map(([name, value]) => ({ name, detail: `${value.games} games`, votes: value.votes }))} />
        </div>
        {insights.totalVotes === 0 && <div className="gf-empty"><h2>NOT ENOUGH SIGNAL YET.</h2><p>These charts will populate when the available game records contain community votes.</p><button onClick={() => onNavigate("duels")}>START BUILDING THE DATA ↗</button></div>}
      </>}
    <div className="gf-page-cta"><span>DATA BECOMES INTERESTING WHEN YOU PLAY.</span><button className="gf-button gf-button-primary" onClick={() => onNavigate("duels")}>ENTER A DUEL ↗</button></div>
  </section>;
}

function InsightColumn({ index, title, subtitle, rows }: { index: string; title: string; subtitle: string; rows: { name: string; detail: string; votes: number }[] }) {
  const max = Math.max(...rows.map((row) => row.votes), 1);
  return <article className="gf-insight-column"><div className="gf-insight-head"><span>{index} / INSIGHT</span><h2>{title}</h2><p>{subtitle}</p></div>
    {rows.length ? rows.map((row) => <div className="gf-insight-row" key={row.name}><div className="gf-insight-row-label"><strong>{row.name}</strong><span>{row.detail}</span></div><div className="gf-insight-track"><i style={{ width: `${Math.max(3, row.votes / max * 100)}%` }} /></div><div className="gf-insight-value">{formatNumber(row.votes)}</div></div>) : <p className="gf-insight-empty">Not enough recorded votes for this breakdown yet.</p>}
  </article>;
}
