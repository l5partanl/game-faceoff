import ThreeHero from "../components/ThreeHero";
import type { AppSection } from "../components/NavigationHub";

type Props = { onNavigate: (section: AppSection) => void; onStart: () => void };

export default function HomePage({ onNavigate, onStart }: Props) {
  return (
    <section className="gf-home">
      <div className="gf-home-grid" aria-hidden="true" />
      <div className="gf-home-kicker"><span className="gf-status-dot" /> THE COMMUNITY GAME INDEX <span>VOL. 001</span></div>
      <div className="gf-home-hero">
        <p className="gf-eyebrow">YOUR TASTE. YOUR CALL.</p>
        <h1>GAME<span className="gf-title-dash">—</span><br /><em>FACEOFF</em><span className="gf-title-star">✳</span></h1>
        <p className="gf-home-copy">Two games enter.<br /><strong>Your vote changes the ranking.</strong></p>
        <ThreeHero label="START DUEL" sublabel="ENTER THE ARENA" onClick={onStart} />
        <span className="gf-home-hint">PICK A SIDE. SHAPE THE META.</span>
      </div>
      <div className="gf-home-quick">
        <button onClick={() => onNavigate("leaderboards")} className="gf-quick gf-quick-rank"><span className="gf-quick-symbol">↗</span><span><small>01 / COMPETE</small><strong>LEADERBOARDS</strong></span><b>OPEN ↗</b></button>
        <button onClick={() => onNavigate("insights")} className="gf-quick gf-quick-insights"><span className="gf-quick-symbol">◉</span><span><small>02 / DISCOVER</small><strong>INSIGHTS</strong></span><b>EXPLORE ↗</b></button>
        <button onClick={() => onNavigate("votes")} className="gf-quick gf-quick-votes"><span className="gf-quick-symbol">✳</span><span><small>03 / COMMUNITY</small><strong>VOTE DATA</strong></span><b>VIEW ↗</b></button>
      </div>
      <div className="gf-home-bottom"><span>NOT A REVIEW. A SHOWDOWN.</span><span>BUILT BY THE PLAYERS.</span></div>
    </section>
  );
}
