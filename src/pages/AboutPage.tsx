
import type { AppSection } from "../components/NavigationHub";

type AboutPageProps = {
  onNavigate: (section: AppSection) => void;
};

export default function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <article className="gf-about">
      <header className="gf-page-hero">
        <span className="gf-eyebrow">BEHIND THE PROJECT / 001</span>

        <h1>
          MORE THAN
          <br />
          A GAME.
          <br />
          <span>A FACE-OFF.</span>
        </h1>

        <p className="gf-about-intro">
          An independent project exploring how players compare,
          discover and rank video games through one simple question:
          which one would you choose?
        </p>

        <button
          className="gf-button gf-button-primary"
          onClick={() => onNavigate("duels")}
        >
          ENTER THE ARENA ↗
        </button>
      </header>

      <section className="gf-about-section">
        <span className="gf-eyebrow">01 / THE IDEA</span>
        <h2>Two games. One choice.</h2>
        <p>
          Game-Faceoff is a web application built around head-to-head
          video game matchups. Players choose between two contenders,
          contribute to community rankings and discover how their
          preferences compare with other players.
        </p>
        <p>
          Matchups can explore similarities, contrasts, different
          generations and unexpected combinations. The goal is to make
          game discovery interactive, quick and worth coming back to.
        </p>
      </section>

      <section className="gf-about-section">
        <span className="gf-eyebrow">02 / HOW IT WORKS</span>
        <h2>Every vote counts.</h2>

        <ul className="gf-about-list">
          <li>
            <strong>DUELS</strong>
            <span>Choose between two games in a head-to-head matchup.</span>
          </li>
          <li>
            <strong>VOTES</strong>
            <span>Explore the community's accumulated voting results.</span>
          </li>
          <li>
            <strong>LEADERBOARDS</strong>
            <span>See how games compare through community rankings.</span>
          </li>
          <li>
            <strong>INSIGHTS</strong>
            <span>Find patterns and interesting trends in player choices.</span>
          </li>
        </ul>

        <p className="gf-about-note">
          Rankings and insights depend on the data collected and the
          features currently implemented in the application.
        </p>
      </section>

      <section className="gf-about-section">
        <span className="gf-eyebrow">03 / THE PURPOSE</span>
        <h2>Built to learn by building.</h2>
        <p>
          This project is part of my independent development portfolio.
          It brings together interface design, frontend development,
          backend integration, database-backed data and interactive
          product experiences in a single evolving application.
        </p>
        <p>
          Beyond the voting experience, Game-Faceoff is an opportunity
          to explore how a product can combine visual identity, usable
          interactions and data-driven features into a coherent whole.
        </p>
      </section>

      <section className="gf-about-section gf-about-author">
        <span className="gf-eyebrow">04 / AUTHORSHIP</span>
        <h2>Designed and developed by me.</h2>

        <p>
          Game-Faceoff is an independent personal project conceived and
          developed by Gian Caorlin as part of my professional portfolio.
        </p>

        <ul className="gf-about-list">
          <li>
            <strong>CONCEPT & PRODUCT</strong>
            <span>Project idea, scope and feature direction.</span>
          </li>
          <li>
            <strong>DESIGN & EXPERIENCE</strong>
            <span>Visual identity, interface direction and user flows.</span>
          </li>
          <li>
            <strong>DEVELOPMENT</strong>
            <span>Application implementation and ongoing improvements.</span>
          </li>
        </ul>

        <p>
          Game-Faceoff is an independent project and is not presented
          as an official product of any game publisher or platform.
          Third-party game names, artwork and related metadata remain
          the property of their respective owners.
        </p>

        <div className="gf-about-copyright">
          <span>PROJECT AUTHOR</span>

<a
  href="https://gian-portfolio2026.web.app/"
  target="_blank"
  rel="noreferrer"
  className="gf-author-link"
>
  Gian Caorlin ↗
</a>
          <span>
            © {new Date().getFullYear()} Gian Caorlin. All rights
            reserved for original project materials, design and code,
            subject to applicable third-party rights and licenses.
          </span>
        </div>
      </section>

      <section className="gf-about-end">
        <span className="gf-eyebrow">YOUR TURN</span>
        <h2>Which side are you on?</h2>
        <button
          className="gf-button gf-button-primary"
          onClick={() => onNavigate("duels")}
        >
          START VOTING ↗
        </button>
      </section>
    </article>
  );
}
