import React, { useState, useEffect, useRef } from "react";

const SYMBOLS = ["🐉", "🍀", "💰", "🔔", "🍒", "⭐", "💎"];

const BET_VALUES = [
  0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0,
  8.0, 12.0, 15.0, 16.0, 20.0, 24.0, 28.0, 30.0, 32.0,
  36.0, 40.0, 45.0, 50.0, 75.0, 100.0, 120.0, 150.0, 250.0, 500.0,
];

const AUTOSPIN_OPTIONS = [10, 30, 80, 1000];

const BASE_SYMBOL_PRIZES = {
  "🐉": 4,
  "🍀": 2,
  "💰": 1,
  "🔔": 0.75,
  "🍒": 0.5,
  "⭐": 0.2,
  "💎": 10,
};

function getMultiplier() {
  const r = Math.random();
  if (r < 0.005) return 10;
  if (r < 0.04) return 5;
  if (r < 0.22) return 2;
  return null;
}

function getRandomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

export default function SlotMachine() {
  const [grid, setGrid] = useState(() =>
    Array.from({ length: 3 }).map(() =>
      Array.from({ length: 3 }).map(() => getRandomSymbol())
    )
  );

  const [balance, setBalance] = useState(1000);
  const [betIndex, setBetIndex] = useState(5);
  const bet = BET_VALUES[betIndex];

  const [lastWin, setLastWin] = useState(0);
  const [multiplier, setMultiplier] = useState(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);

  // AutoSpin revisado
  const [autoSpinRemaining, setAutoSpinRemaining] = useState(0);

  const [highlightedCells, setHighlightedCells] = useState(() => new Set());

  const [winOverlay, setWinOverlay] = useState({
    visible: false,
    title: "",
    finalAmount: 0,
  });
  const [winOverlayAmount, setWinOverlayAmount] = useState(0);

  const [specialEvent, setSpecialEvent] = useState({
    active: false,
    phase: "none",
    targetSymbol: null,
    spinsLeft: 0,
  });

  const balanceRef = useRef(balance);
  const betRef = useRef(bet);
  const autoSpinRemainingRef = useRef(autoSpinRemaining);
  const spinningRef = useRef(isSpinning);
  const timeoutRef = useRef(null);
  const animationRef = useRef(null);

  const SYMBOL_PRIZES = {
    "⭐": 0.2,
    "🍒": 0.5,
    "💰": 0.75,
    "🔔": 1,
    "🍀": 2,
    "🐉": 4,
    "💎": 8,
  };

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    betRef.current = bet;
  }, [bet]);

  useEffect(() => {
    autoSpinRemainingRef.current = autoSpinRemaining;
  }, [autoSpinRemaining]);

  useEffect(() => {
    spinningRef.current = isSpinning;
  }, [isSpinning]);

  function calculateWinWithHighlights(finalGrid, baseBet, mult) {
    let payout = 0;
    const winCells = new Set();

    const markLine = (coords) => {
      coords.forEach(([r, c]) => {
        winCells.add(`${r}-${c}`);
      });
    };

    for (let r = 0; r < 3; r++) {
      const row = finalGrid[r];
      const nonWild = row.filter((s) => s !== "💎");

      if (nonWild.length === 0) {
        payout += baseBet * SYMBOL_PRIZES["💎"];
        markLine([[r, 0], [r, 1], [r, 2]]);
        continue;
      }

      const target = nonWild[0];
      const allEqual = nonWild.every((s) => s === target);

      if (allEqual) {
        payout += baseBet * SYMBOL_PRIZES[target];
        markLine([[r, 0], [r, 1], [r, 2]]);
      }
    }

    const diag1 = [finalGrid[0][0], finalGrid[1][1], finalGrid[2][2]];
    const nonWildDiag1 = diag1.filter((s) => s !== "💎");
    if (nonWildDiag1.length === 0) {
      payout += baseBet * SYMBOL_PRIZES["💎"];
      markLine([[0, 0], [1, 1], [2, 2]]);
    } else {
      const target = nonWildDiag1[0];
      const allEqual = nonWildDiag1.every((s) => s === target);
      if (allEqual) {
        payout += baseBet * SYMBOL_PRIZES[target];
        markLine([[0, 0], [1, 1], [2, 2]]);
      }
    }

    const diag2 = [finalGrid[0][2], finalGrid[1][1], finalGrid[2][0]];
    const nonWildDiag2 = diag2.filter((s) => s !== "💎");
    if (nonWildDiag2.length === 0) {
      payout += baseBet * SYMBOL_PRIZES["💎"];
      markLine([[0, 2], [1, 1], [2, 0]]);
    } else {
      const target = nonWildDiag2[0];
      const allEqual = nonWildDiag2.every((s) => s === target);
      if (allEqual) {
        payout += baseBet * SYMBOL_PRIZES[target];
        markLine([[0, 2], [1, 1], [2, 0]]);
      }
    }

    if (mult) payout *= mult;
    payout = Math.round(payout * 100) / 100;

    return { payout, winCells };
  }

  useEffect(() => {
    if (!winOverlay.visible) return;

    const duration = 1200;
    const start = performance.now();
    const target = winOverlay.finalAmount;

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const current = target * progress;
      setWinOverlayAmount(Math.round(current * 100) / 100);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [winOverlay.visible, winOverlay.finalAmount]);

  function spin() {
    if (spinningRef.current) return;
    if (balanceRef.current < betRef.current) {
      // sem saldo, cancela AutoSpin se tiver
      if (autoSpinRemainingRef.current > 0) setAutoSpinRemaining(0);
      return;
    }

    setIsSpinning(true);
    spinningRef.current = true;

    setHighlightedCells(new Set());
    setWinOverlay((prev) => ({ ...prev, visible: false }));
    setWinOverlayAmount(0);

    setSpecialEvent({
      active: false,
      phase: "none",
      targetSymbol: null,
      spinsLeft: 0,
    });

    setBalance((prev) => {
      const next = Math.round((prev - betRef.current) * 100) / 100;
      balanceRef.current = next;
      return next;
    });

    const frames = turbo ? 6 : 12;
    const frameDelay = turbo ? 60 : 100;

    let frame = 0;
    clearTimeout(timeoutRef.current);

    function frameStep() {
      setGrid(
        Array.from({ length: 3 }).map(() =>
          Array.from({ length: 3 }).map(() => getRandomSymbol())
        )
      );

      frame++;
      if (frame < frames) {
        timeoutRef.current = setTimeout(frameStep, frameDelay);
      } else {
        const finalGrid = Array.from({ length: 3 }).map(() =>
          Array.from({ length: 3 }).map(() => getRandomSymbol())
        );
        setGrid(finalGrid);

        const triggerSpecial = Math.random() < 0.05;

        if (triggerSpecial) {
          const nonWildSymbols = SYMBOLS.filter((s) => s !== "💎");
          const targetSymbol =
            nonWildSymbols[
              Math.floor(Math.random() * nonWildSymbols.length)
            ];

          const eventState = {
            active: true,
            phase: "fading",
            targetSymbol,
            spinsLeft: 6,
          };
          setSpecialEvent(eventState);
          startSpecialFading(eventState, finalGrid);
        } else {
          const mult = getMultiplier();
          setMultiplier(mult);

          const { payout, winCells } = calculateWinWithHighlights(
            finalGrid,
            betRef.current,
            mult
          );
          finishSpinWithPayout(finalGrid, payout, winCells);
        }
      }
    }

    timeoutRef.current = setTimeout(frameStep, frameDelay);
  }

  function startSpecialFading(initialState, baseGrid) {
    let state = { ...initialState };
    let currentGrid = baseGrid;

    const spinForeverStep = () => {
      currentGrid = Array.from({ length: 3 }).map(() =>
        Array.from({ length: 3 }).map(() => getRandomSymbol())
      );
      setGrid(currentGrid);

      if (state.active && state.phase === "fading") {
        timeoutRef.current = setTimeout(spinForeverStep, 250);
      }
    };

    timeoutRef.current = setTimeout(spinForeverStep, 0);

    setTimeout(() => {
      state = {
        ...state,
        phase: "active",
      };
      setSpecialEvent(state);
      runSpecialEventActive(state, currentGrid);
    }, 1500);
  }

  function runSpecialEventActive(initialState, initialGrid) {
    let state = { ...initialState };
    let currentGrid = initialGrid;
    const slowDelay = 450;

    const spinStep = () => {
      if (!state.active || state.spinsLeft <= 0) {
        const { payout, winCells } = calculateWinWithHighlights(
          currentGrid,
          betRef.current,
          null
        );
        finishSpinWithPayout(currentGrid, payout, winCells);
        setSpecialEvent({
          active: false,
          phase: "none",
          targetSymbol: null,
          spinsLeft: 0,
        });
        return;
      }

      const newGrid = currentGrid.map((row, r) =>
        row.map((sym, c) => {
          if (sym === state.targetSymbol || sym === "💎") {
            return sym;
          }
          return getRandomSymbol();
        })
      );

      currentGrid = newGrid;
      setGrid(newGrid);

      const allMatch = newGrid.every((row) =>
        row.every((sym) => sym === state.targetSymbol || sym === "💎")
      );

      if (allMatch) {
        const { payout, winCells } = calculateWinWithHighlights(
          newGrid,
          betRef.current,
          null
        );
        const boosted = Math.round(payout * 10 * 100) / 100;
        finishSpinWithPayout(newGrid, boosted, winCells);

        setSpecialEvent({
          active: false,
          phase: "none",
          targetSymbol: null,
          spinsLeft: 0,
        });
        return;
      }

      state = {
        ...state,
        spinsLeft: state.spinsLeft - 1,
      };
      setSpecialEvent(state);

      if (state.spinsLeft > 0) {
        timeoutRef.current = setTimeout(spinStep, slowDelay);
      } else {
        const { payout, winCells } = calculateWinWithHighlights(
          newGrid,
          betRef.current,
          null
        );
        finishSpinWithPayout(newGrid, payout, winCells);
        setSpecialEvent({
          active: false,
          phase: "none",
          targetSymbol: null,
          spinsLeft: 0,
        });
      }
    };

    timeoutRef.current = setTimeout(spinStep, slowDelay);
  }

  function finishSpinWithPayout(finalGrid, payout, winCells) {
    setHighlightedCells(winCells);
    setLastWin(payout);

    if (payout > 0) {
      setBalance((prev) => {
        const next = Math.round((prev + payout) * 100) / 100;
        balanceRef.current = next;
        return next;
      });

      const effectiveMult = payout / betRef.current;

      if (effectiveMult >= 8) {
        let title = "BIG WIN";
        if (effectiveMult >= 10 && effectiveMult < 15) {
          title = "SUPER WIN";
        } else if (effectiveMult >= 15) {
          title = "MEGA WIN";
        }

        setWinOverlay({
          visible: true,
          title,
          finalAmount: payout,
        });

        setTimeout(() => {
          setWinOverlay((prev) => ({ ...prev, visible: false }));
        }, 2500);
      }
    }

    setIsSpinning(false);
    spinningRef.current = false;

    // se autospin ainda tem giros, dispara o próximo
    if (autoSpinRemainingRef.current > 0 && balanceRef.current >= betRef.current) {
      setAutoSpinRemaining((prev) => prev - 1);
      timeoutRef.current = setTimeout(() => {
        if (autoSpinRemainingRef.current > 0 && !spinningRef.current) {
          spin();
        }
      }, turbo ? 150 : 700);
    } else {
      // acaba o autospin se zerou ou sem saldo
      setAutoSpinRemaining(0);
    }
  }

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const isFading = specialEvent.phase === "fading";
  const isEventActive = specialEvent.phase === "active";

  const bgClass =
    isFading || isEventActive
      ? "bg-gradient-to-b from-black to-red-800 transition-colors duration-1000"
      : "bg-gradient-to-b from-black to-blue-600 transition-colors duration-1000";

  const cardBgClass =
    isFading || isEventActive
      ? "bg-gradient-to-br from-red-900 to-red-700 border-red-400"
      : "bg-gradient-to-br from-blue-900 to-purple-800 border-blue-400";

  const gridBgClass =
    isFading || isEventActive ? "bg-red-950/60" : "bg-blue-950/50";

  const handleBetDown = () => {
    setBetIndex((idx) => Math.max(0, idx - 1));
  };

  const handleBetUp = () => {
    setBetIndex((idx) => Math.min(BET_VALUES.length - 1, idx + 1));
  };

  // clique no botão Auto: se já tem autospin, abre opções para sobrescrever; se não, idem
  const handleAutoSpinClick = () => {
    if (isSpinning) return;
    // aqui, em vez de modal, usa um menu simples inline (poderia virar modal, se quiser)
    // para manter simples, alterna um pequeno menu abaixo (estado local poderia ser adicionado)
    // Para ficar direto: pergunta no prompt
    const choice = window.prompt(
      "Escolha giros automáticos: 10, 30, 80 ou 1000",
      "10"
    );
    const value = Number(choice);
    if (!AUTOSPIN_OPTIONS.includes(value)) return;
    if (balanceRef.current < betRef.current) return;

    setAutoSpinRemaining(value);
    // dispara o primeiro spin imediatamente
    if (!spinningRef.current) {
      spin();
    }
  };

  // botão SPIN cancela AutoSpin se estiver ativo e não estiver girando
  const handleSpinButtonClick = () => {
    if (autoSpinRemainingRef.current > 0 && !isSpinning) {
      setAutoSpinRemaining(0);
      clearTimeout(timeoutRef.current);
      return;
    }
    spin();
  };

  const spinButtonLabel =
    autoSpinRemaining > 0
      ? `AUTO: ${autoSpinRemaining}`
      : isSpinning
      ? "..."
      : "SPIN";

  return (
    <>
      {winOverlay.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center animate-bounce">
            <div className="text-4xl md:text-6xl font-extrabold text-yellow-300 drop-shadow-[0_0_25px_rgba(250,204,21,0.9)] mb-4">
              {winOverlay.title}
            </div>
            <div className="text-2xl md:text-4xl font-bold text-white mb-2">
              PRIZE
            </div>
            <div className="text-3xl md:text-5xl font-extrabold text-green-300 drop-shadow-[0_0_20px_rgba(74,222,128,0.9)]">
              R$ {winOverlayAmount.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <div
        className={`min-h-screen flex items-center justify-center p-6 text-white ${bgClass}`}
      >
        <div
          className={`w-full max-w-md rounded-2xl p-4 shadow-2xl border-2 ${cardBgClass}`}
        >
          <h2 className="text-center text-2xl font-extrabold mb-3">
            Fortune&apos;s Segalla
          </h2>

          <div className="text-center h-7 mb-2">
            {multiplier ? (
              <span className="text-yellow-300 font-bold">
                Multiplicador: x{multiplier}
              </span>
            ) : (
              <span className="text-gray-300">Multiplicador: —</span>
            )}
          </div>

          <div
            className={`grid grid-rows-3 gap-2 ${gridBgClass} p-3 rounded-lg mb-2`}
          >
            {grid.map((row, r) => (
              <div key={r} className="flex justify-center gap-2">
                {row.map((sym, c) => {
                  const key = `${r}-${c}`;
                  const isHighlighted = highlightedCells.has(key);
                  return (
                    <div
                      key={c}
                      className={`w-20 h-20 flex items-center justify-center text-3xl rounded-lg bg-gradient-to-br from-pink-600/30 to-purple-800/30 border-2 ${
                        sym === "💎"
                          ? "border-yellow-400"
                          : isFading || isEventActive
                          ? "border-red-400/80"
                          : "border-blue-500/60"
                      } ${
                        isHighlighted
                          ? "ring-4 ring-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.9)] animate-pulse"
                          : ""
                      }`}
                    >
                      {sym}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mb-4 text-center">
            {lastWin > 0 ? (
              <span className="inline-block px-3 py-1 rounded-full bg-yellow-300 text-purple-800 font-bold text-sm shadow-md">
                Ganhou nesta rodada: R$ {lastWin.toFixed(2)}
              </span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full bg-gray-700 text-gray-200 text-xs">
                Nenhum ganho nesta rodada
              </span>
            )}
          </div>

          <div className="flex justify-between items-center mb-3 text-sm">
            <div>
              <div className="text-xs text-gray-300">Saldo</div>
              <div className="font-bold">R$ {balance.toFixed(2)}</div>
            </div>

            <div>
              <div className="text-xs text-gray-300">Aposta</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBetDown}
                  disabled={betIndex === 0}
                  className="px-2 py-1 bg-purple-700 rounded disabled:opacity-40"
                >
                  −
                </button>
                <div className="w-24 text-center">
                  R$ {bet.toFixed(2)}
                </div>
                <button
                  onClick={handleBetUp}
                  disabled={betIndex === BET_VALUES.length - 1}
                  className="px-2 py-1 bg-purple-700 rounded disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-300">Último ganho</div>
              <div className="font-bold">R$ {lastWin.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <button
              onClick={handleAutoSpinClick}
              disabled={isSpinning}
              className={`justify-self-start px-3 py-2 rounded-xl font-bold ${
                autoSpinRemaining > 0 ? "bg-green-500" : "bg-gray-600 hover:bg-gray-700"
              } disabled:opacity-50`}
            >
              Auto
            </button>

            <button
              onClick={handleSpinButtonClick}
              disabled={isSpinning && autoSpinRemaining === 0}
              className={`justify-self-center w-20 h-20 rounded-full flex items-center justify-center text-lg font-extrabold transition transform ${
                (isSpinning && autoSpinRemaining === 0) || balance < bet
                  ? "bg-gray-500 text-gray-200 cursor-not-allowed"
                  : "bg-yellow-300 text-purple-700 hover:scale-105 shadow-lg"
              }`}
            >
              {spinButtonLabel}
            </button>

            <button
              onClick={() => setTurbo((t) => !t)}
              className={`justify-self-end px-3 py-2 rounded-xl font-bold ${
                turbo ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              Turbo {turbo ? "ON" : "OFF"}
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-300"></div>
        </div>
      </div>
    </>
  );
}
