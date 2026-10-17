import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Duel from "./components/Duel";
import NavigationHub, { type AppSection } from "./components/NavigationHub";
import HomePage from "./pages/HomePage";
import LeaderboardsPage from "./pages/LeaderboardsPage";
import VotesPage from "./pages/VotesPage";
import InsightsPage from "./pages/InsightsPage";
import AboutPage from "./pages/AboutPage";
import { fetchNextDuel } from "./services/api";
import type { DuelData, DuelMode } from "./services/api";
import "./styles/game-faceoff.css";
import GameInfoModal from "./components/GameInfoModal";
import type { GameStat } from "./services/stats";

const modes: DuelMode[] = [
  "SIMILARITY",
  "CONTRAST",
  "DISCOVERY",
  "CLASSIC_VS_MODERN",
  "UNDERDOG_VS_POPULAR",
  "SAME_FRANCHISE",
  "CRITICS_VS_COMMUNITY",
  "RANDOM_CHAOS",
];

type Section = AppSection | "about";

const paths: Record<Section, string> = {
  home: "/",
  duels: "/duels",
  leaderboards: "/leaderboards",
  votes: "/votes",
  insights: "/insights",
  about: "/about",
};

const PORTFOLIO_URL = "https://gian-portfolio2026.web.app/";

function readSection(): Section {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const match = Object.entries(paths).find(([, value]) => value === path);
  return (match?.[0] as Section | undefined) ?? "home";
}

function randomMode(): DuelMode {
  return modes[Math.floor(Math.random() * modes.length)];
}

function SocialLinks() {
  return (
    <nav className="gf-social-links" aria-label="Social media">
      <a
        href="https://instagram.com/gian.caorlin"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
        title="Instagram"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle className="gf-social-fill" cx="17.5" cy="6.8" r="1" />
        </svg>
      </a>
      <a
        href="https://linkedin.com/in/gian-caorlin"
        target="_blank"
        rel="noreferrer"
        aria-label="LinkedIn"
        title="LinkedIn"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 8.5V19M5 5v.1M10 19v-6c0-2 1.2-3.2 3-3.2s3 1.2 3 3.2v6M10 10v9M3 3h18v18H3z" />
        </svg>
      </a>
      <a
        href="https://github.com/l5partanl"
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
        title="GitHub"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 19c-4.5 1.4-4.5-2.5-6-3m12 6v-3.9c0-1.1.1-1.7-.5-2.3 3.3-.4 6.8-1.6 6.8-7.3a5.7 5.7 0 0 0-1.5-3.9 5.3 5.3 0 0 0-.1-3.9s-1.2-.4-4 1.5a13.7 13.7 0 0 0-7.3 0C5.6.3 4.4.7 4.4.7a5.3 5.3 0 0 0-.1 3.9 5.7 5.7 0 0 0-1.5 3.9c0 5.7 3.5 6.9 6.8 7.3-.5.5-.6 1.1-.6 2.1V22" />
        </svg>
      </a>
    </nav>
  );
}

export default function App() {
  const [section, setSection] = useState<Section>(readSection);
  const [hubOpen, setHubOpen] = useState(false);
  const [duel, setDuel] = useState<DuelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = (
    import.meta.env.VITE_API_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");

  const navigate = useCallback((next: Section) => {
    if (window.location.pathname !== paths[next]) {
      window.history.pushState({}, "", paths[next]);
    }

    setSection(next);
    setHubOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const loadDuel = useCallback(
    async (requestedMode?: DuelMode) => {
      if (loading) return;

      const selectedMode = requestedMode ?? randomMode();
      setLoading(true);
      setError(null);

      try {
        const nextDuel = await fetchNextDuel(selectedMode);
        setDuel(nextDuel);
      } catch (err) {
        console.error("Failed to load duel:", err);
        setError(
          err instanceof Error ? err.message : "Could not load the next duel.",
        );
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  const [selectedInfoGame, setSelectedInfoGame] = useState<GameStat | null>(
    null,
  );

  const openGameInfo = useCallback((game: GameStat) => {
    setSelectedInfoGame(game);
  }, []);

  const closeGameInfo = useCallback(() => {
    setSelectedInfoGame(null);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setSection(readSection());
      setHubOpen(false);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (section === "duels" && !duel && !loading && !error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadDuel("SIMILARITY");
    }
  }, [section, duel, loading, error, loadDuel]);

  const openDuel = useCallback(() => {
    navigate("duels");
    if (!duel && !loading) {
      void loadDuel("SIMILARITY");
    }
  }, [navigate, duel, loading, loadDuel]);

  // Mantiene el VS original como acceso al menú, sin modificar Duel.tsx.
  useEffect(() => {
    if (section !== "duels") return;

    const vs = document.querySelector(".duel-stage .duel-vs");
    if (!vs) return;

    const element = vs as HTMLElement;
    const previousCursor = element.style.cursor;

    const openMenu = (event: Event) => {
      event.preventDefault();
      setHubOpen(true);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setHubOpen(true);
      }
    };

    element.style.cursor = "pointer";
    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");
    element.setAttribute("aria-label", "Open navigation menu");
    element.addEventListener("click", openMenu);
    element.addEventListener("keydown", onKeyDown);

    return () => {
      element.removeEventListener("click", openMenu);
      element.removeEventListener("keydown", onKeyDown);
      element.style.cursor = previousCursor;
      element.removeAttribute("role");
      element.removeAttribute("tabindex");
      element.removeAttribute("aria-label");
    };
  }, [section, duel]);

  let screen: ReactNode = null;

  switch (section) {
    case "home":
      screen = <HomePage onNavigate={navigate} onStart={openDuel} />;
      break;

    case "duels":
      if (loading && !duel) {
        screen = (
          <div className="gf-state" role="status">
            <span className="gf-eyebrow">LOADING MATCHUP</span>
            <h1>ENTERING THE ARENA</h1>
            <div className="gf-loader" />
          </div>
        );
      } else if (!duel && error) {
        screen = (
          <div className="gf-state" role="alert">
            <span className="gf-eyebrow">CONNECTION ERROR</span>
            <h1>THE ARENA IS OFFLINE</h1>
            <p>{error}</p>
            <button
              className="gf-button gf-button-primary"
              disabled={loading}
              onClick={() => void loadDuel("SIMILARITY")}
            >
              RETRY
            </button>
          </div>
        );
      } else if (duel) {
        screen = (
          <div className="gf-duel-page">
            <Duel
              key={`${duel.games[0].id}-${duel.games[1].id}`}
              duel={duel.games}
              mode={duel.mode}
              reason={duel.reason}
              onNextDuel={() => void loadDuel()}
            />

            <button
              className="gf-menu-orb"
              onClick={() => setHubOpen(true)}
              aria-label="Open navigation"
              title="Navigation menu"
            >
              <span>✳</span>
              <i />
            </button>

            {error && (
              <div className="gf-toast" role="status">
                Could not load the next duel: {error}
              </div>
            )}
          </div>
        );
      }
      break;

    case "leaderboards":
      screen = (
        <LeaderboardsPage
          apiBase={apiBase}
          onNavigate={navigate}
          onSelectGame={openGameInfo}
        />
      );
      break;

    case "votes":
      screen = (
        <VotesPage
          apiBase={apiBase}
          onNavigate={navigate}
          onSelectGame={openGameInfo}
        />
      );
      break;

    case "insights":
      screen = <InsightsPage apiBase={apiBase} onNavigate={navigate} />;
      break;

    case "about":
      screen = <AboutPage onNavigate={navigate} />;
      break;
  }

  return (
    <div className={`gf-app ${section === "duels" ? "gf-app-duels" : ""}`}>
      {section !== "duels" && (
        <header className="gf-topbar">
          <button
            className="gf-brand"
            onClick={() => navigate("home")}
            aria-label="Game Faceoff home"
          >
            <span className="gf-brand-mark">GF</span>
            <span>
              GAME<span className="gf-brand-dash">—</span>FACEOFF
            </span>
          </button>

          <nav className="gf-topnav" aria-label="Main navigation">
            {(
              [
                ["duels", "DUELS"],
                ["leaderboards", "LEADERBOARDS"],
                ["insights", "INSIGHTS"],
                ["votes", "VOTES"],
                ["about", "ABOUT"],
              ] as [Section, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                className={section === key ? "is-active" : ""}
                onClick={() => navigate(key)}
                aria-current={section === key ? "page" : undefined}
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            className="gf-nav-trigger"
            onClick={() => setHubOpen(true)}
            aria-label="Open navigation"
          >
            ✳
          </button>
        </header>
      )}

      <main className={`gf-main gf-section-${section}`}>{screen}</main>

      {section !== "duels" && (
        <footer className="gf-footer">
          <span className="gf-footer-brand">GAME—FACEOFF</span>

          <SocialLinks />

          <a
            className="gf-footer-author"
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noreferrer"
          >
            GIAN CAORLIN <span aria-hidden="true">↗</span>
          </a>
        </footer>
      )}

      <NavigationHub
        open={hubOpen}
        onClose={() => setHubOpen(false)}
        onNavigate={(next) => navigate(next)}
      />
      <GameInfoModal game={selectedInfoGame} onClose={closeGameInfo} />
    </div>
  );
}
