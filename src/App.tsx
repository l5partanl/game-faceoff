import { useCallback, useEffect, useState } from "react";
import Duel from "./components/Duel";
import { fetchNextDuel } from "./services/api";
import type { DuelData, DuelMode } from "./services/api";

const modes: DuelMode[] = ["SIMILARITY", "CONTRAST", "DISCOVERY"];

function App() {
  const [duel, setDuel] = useState<DuelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDuel = useCallback(async (mode?: DuelMode) => {
    setLoading(true);
    setError(null);

    const selectedMode =
      mode ?? modes[Math.floor(Math.random() * modes.length)];

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
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDuel("SIMILARITY");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDuel]);

  if (!duel && loading) {
    return (
      <main className="duel-stage" role="status">
        <p>Loading contenders...</p>
      </main>
    );
  }

  if (!duel) {
    return (
      <main className="duel-stage" role="alert">
        <p>{error ?? "Could not load a duel."}</p>
        <button onClick={() => void loadDuel("SIMILARITY")}>TRY AGAIN</button>
      </main>
    );
  }

  return (
    <>
      {error && <div role="alert">Could not load the next duel: {error}</div>}

      <Duel
        key={`${duel.games[0].id}-${duel.games[1].id}`}
        duel={duel.games}
        mode={duel.mode}
        reason={duel.reason}
        onNextDuel={() => void loadDuel()}
      />
    </>
  );
}

export default App;
