import { useEffect } from "react";

export type AppSection =
  | "home"
  | "duels"
  | "leaderboards"
  | "insights"
  | "votes"
  | "about";

type Props = {
  open: boolean;
  onClose: () => void;
  onNavigate: (section: AppSection) => void;
};

const items: {
  id: AppSection;
  number: string;
  title: string;
  sub: string;
  symbol: string;
  tone: string;
}[] = [
  {
    id: "home",
    number: "00",
    title: "HOME",
    sub: "THE STARTING POINT",
    symbol: "⌂",
    tone: "home",
  },
  {
    id: "duels",
    number: "01",
    title: "DUELS",
    sub: "CHOOSE YOUR SIDE",
    symbol: "VS",
    tone: "duels",
  },
  {
    id: "leaderboards",
    number: "02",
    title: "LEADERBOARDS",
    sub: "THE RANKINGS",
    symbol: "↗",
    tone: "rankings",
  },
  {
    id: "insights",
    number: "03",
    title: "INSIGHTS",
    sub: "READ THE META",
    symbol: "◉",
    tone: "insights",
  },
  {
    id: "votes",
    number: "04",
    title: "VOTES",
    sub: "THE COMMUNITY PULSE",
    symbol: "✳",
    tone: "votes",
  },
  {
    id: "about",
    number: "05",
    title: "ABOUT",
    sub: "BEHIND THE PROJECT",
    symbol: "ⓘ",
    tone: "about",
  },
];

export default function NavigationHub({ open, onClose, onNavigate }: Props) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", keydown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="gf-hub-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="gf-hub"
        role="dialog"
        aria-modal="true"
        aria-label="Game Faceoff navigation"
      >
        <div className="gf-hub-head">
          <div>
            <span className="gf-eyebrow">SYSTEM MENU / 001</span>
            <h2>
              CHOOSE YOUR
              <br />
              <em>DESTINATION.</em>
            </h2>
          </div>
          <button
            className="gf-hub-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>
        <div className="gf-hub-grid">
          {items.map((item) => (
            <button
              key={item.id}
              className={`gf-hub-card gf-hub-${item.tone}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="gf-hub-number">{item.number} / SECTION</span>
              <span className="gf-hub-object" aria-hidden="true">
                <span>{item.symbol}</span>
                <i />
                <b />
              </span>
              <span className="gf-hub-title">{item.title}</span>
              <span className="gf-hub-sub">{item.sub}</span>
              <span className="gf-hub-arrow">↗</span>
            </button>
          ))}
        </div>
        <div className="gf-hub-foot">
          <span>GAME—FACEOFF</span>
          <span>PRESS ESC TO CLOSE</span>
        </div>
      </section>
    </div>
  );
}
