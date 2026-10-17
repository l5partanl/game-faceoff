import { useEffect, useMemo, useState } from "react";
import type { AppSection } from "../components/NavigationHub";
import { fetchStats, formatNumber, type GameStat } from "../services/stats";

type Props = { apiBase: string; onNavigate: (section: AppSection) => void };

export default function VotesPage({ apiBase, onNavigate }: Props) {
  const [games, setGames] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchStats(apiBase).then(({ games }) => { if (active) setGames(games); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load vote statistics."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [apiBase]);

  const totals = useMemo(() => ({
    votes: games.reduce((sum, game) => sum + game.votes, 0),
    wins: games.reduce((sum, game) => sum + game.wins, 0),
    participating: games.filter((game) => game.votes > 0).length,
    catalog: games.length,
  }), [games]);

  const mostVoted = useMemo(() => [...games].sort((a, b) => b.votes - a.votes).filter((g) => g.votes > 0).slice(0, 8), [games]);

  return <section className="gf-page">
    <div className="gf-page-hero"><span className="gf-eyebrow">02 / COMMUNITY SIGNAL</span><h1>EVERY VOTE<br /><em>COUNTS.</em></h1><p>Aggregated community activity. No user profiles, no duel history — just the signal left behind.</p></div>
    {loading ? <div className="gf-state"><div className="gf-loader" /><p>READING THE COMMUNITY SIGNAL…</p></div> :
      error ? <div className="gf-empty"><h2>DATA CONNECTION LOST</h2><p>{error}</p><button onClick={() => onNavigate("duels")}>GO TO DUELS ↗</button></div> :
      <>
        <div className="gf-stat-grid">
          <article className="gf-stat-card gf-stat-yellow"><small>AGGREGATED GAME VOTES</small><strong>{formatNumber(totals.votes)}</strong><span>Votes counted across game records</span></article>
          <article className="gf-stat-card"><small>GAMES WITH VOTES</small><strong>{formatNumber(totals.participating)}</strong><span>Games with at least one recorded vote</span></article>
          <article className="gf-stat-card"><small>CATALOG SIZE</small><strong>{formatNumber(totals.catalog)}</strong><span>Games returned by the statistics API</span></article>
        </div>
        <div className="gf-section-heading"><span className="gf-eyebrow">THE MOST ACTIVE GAMES</span><h2>COMMUNITY <em>FAVORITES.</em></h2></div>
        {mostVoted.length ? <div className="gf-voted-grid">{mostVoted.map((game, i) => <article className="gf-voted-card" key={game.id || game.name}>
          <span className="gf-voted-index">0{i + 1}</span><div className="gf-voted-cover">{game.cover ? <img src={game.cover} alt="" loading="lazy" /> : <span>GF</span>}</div>
          <div className="gf-voted-info"><strong>{game.name}</strong><span>{formatNumber(game.votes)} VOTES</span></div>
          <div className="gf-voted-bar"><i style={{ width: `${Math.max(5, game.votes / Math.max(...mostVoted.map((g) => g.votes), 1) * 100)}%` }} /></div>
        </article>)}</div> : <div className="gf-empty"><h2>THE FIRST VOTE STARTS IT ALL.</h2><p>No game has accumulated votes in the available statistics yet.</p><button onClick={() => onNavigate("duels")}>BE THE FIRST ↗</button></div>}
      </>}
    <div className="gf-page-cta"><span>MAKE YOUR PICK. MOVE THE NUMBERS.</span><button className="gf-button gf-button-primary" onClick={() => onNavigate("duels")}>START DUEL ↗</button></div>
  </section>;
}
