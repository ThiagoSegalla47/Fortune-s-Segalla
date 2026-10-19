import { getMultiplierOffset, MULTIPLIER_ITEM_WIDTH_PERCENT } from "./multiplierReel.js";
import "./MultiplierReel.css";

export default function MultiplierReel({ reel, multiplier, isSpinning }) {
  const hasCenteredMultiplier = !isSpinning && multiplier !== null;
  const status = isSpinning
    ? "Sorteando multiplicador…"
    : reel.id === 0
    ? "O número no centro multiplica seu ganho"
    : hasCenteredMultiplier
    ? `No centro: ${multiplier}x${multiplier === 1 ? " · ganho original" : ""}`
    : "Sem número no centro · ganho original";

  return (
    <section className="multiplier-reel" aria-label="Faixa de multiplicadores" aria-busy={isSpinning}>
      <div className="multiplier-reel__heading">Multiplicadores</div>
      <div className={`multiplier-reel__window ${isSpinning ? "multiplier-reel__window--spinning" : ""} ${hasCenteredMultiplier ? "multiplier-reel__window--active" : ""}`}>
        <div className="multiplier-reel__center" aria-hidden="true" />
        <div
          key={reel.id}
          className={`multiplier-reel__track ${isSpinning ? "multiplier-reel__track--spinning" : ""}`}
          aria-hidden="true"
          style={{
            "--item-width": `${MULTIPLIER_ITEM_WIDTH_PERCENT}%`,
            "--start-offset": `${getMultiplierOffset(reel.startPosition ?? 1)}%`,
            "--stop-offset": `${getMultiplierOffset(reel.stopPosition)}%`,
            "--spin-duration": `${reel.duration}ms`,
          }}
        >
          {reel.items.map((value, index) => (
            <div key={index} className="multiplier-reel__item">
              <span className={`multiplier-reel__number ${hasCenteredMultiplier && index === reel.stopPosition ? "multiplier-reel__number--active" : ""}`}>
                {value}x
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="multiplier-reel__status" role="status">{status}</p>
    </section>
  );
}
