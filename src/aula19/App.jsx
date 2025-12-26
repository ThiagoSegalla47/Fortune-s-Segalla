import React, { useState, useEffect, useRef } from "react";

const SYMBOLS = ["🐉", "🍀", "💰", "🔔", "🍒", "⭐", "💎"];

const BASE_SYMBOL_PRIZES = {
  "🐉": 4,
  "🍀": 2,
  "💰": 1,
  "🔔": 0.75,
  "🍒": 0.5,
  "⭐": 0.2,
  "💎": 10, // WILD, usado especial
};

// probabilidade: ~78% nada, 18% 2x, 3.5% 5x, 0.5% 10x (ajuste se quiser)
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
  const [bet, setBet] = useState(10);
  const [lastWin, setLastWin] = useState(0);
  const [multiplier, setMultiplier] = useState(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);

  // NOVO: células destacadas (efeito especial)
  const [highlightedCells, setHighlightedCells] = useState(() => new Set());

  const balanceRef = useRef(balance);
  const betRef = useRef(bet);
  const autoSpinRef = useRef(autoSpin);
  const spinningRef = useRef(isSpinning);
  const timeoutRef = useRef(null);

  // Atualiza os prêmios conforme solicitado
  const SYMBOL_PRIZES = {
    "⭐": 0.2,  // Star
    "🍒": 0.5,  // Cherry
    "💰": 0.75, // Bag
    "🔔": 1,    // Bell
    "🍀": 2,    // Lucky Clover
    "🐉": 4,    // Dragon
    "💎": 8     // Wild
  };

  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { betRef.current = bet; }, [bet]);
  useEffect(() => { autoSpinRef.current = autoSpin; }, [autoSpin]);
  useEffect(() => { spinningRef.current = isSpinning; }, [isSpinning]);

  // NOVO: calcula prêmio + células vencedoras
  function calculateWinWithHighlights(finalGrid, baseBet, mult) {
    let payout = 0;
    const winCells = new Set();

    // helper para registrar células de uma linha
    const markLine = (coords) => {
      coords.forEach(([r, c]) => {
        winCells.add(`${r}-${c}`);
      });
    };

    // Linhas horizontais
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

    // Diagonal principal
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

    // Diagonal secundária
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

  function spin() {
    if (spinningRef.current) return;
    if (balanceRef.current < betRef.current) {
      if (autoSpinRef.current) setAutoSpin(false);
      return;
    }

    setIsSpinning(true);
    spinningRef.current = true;

    // limpa destaques ao iniciar novo spin
    setHighlightedCells(new Set());

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

        const mult = getMultiplier();
        setMultiplier(mult);

        const { payout, winCells } = calculateWinWithHighlights(
          finalGrid,
          betRef.current,
          mult
        );
        setLastWin(payout);
        setHighlightedCells(winCells);

        if (payout > 0) {
          setBalance((prev) => {
            const next = Math.round((prev + payout) * 100) / 100;
            balanceRef.current = next;
            return next;
          });
        }

        setIsSpinning(false);
        spinningRef.current = false;

        if (autoSpinRef.current) {
          const pauseBetween = turbo ? 150 : 700;
          timeoutRef.current = setTimeout(() => {
            if (autoSpinRef.current && balanceRef.current >= betRef.current) {
              spin();
            } else {
              setAutoSpin(false);
            }
          }, pauseBetween);
        }
      }
    }

    timeoutRef.current = setTimeout(frameStep, frameDelay);
  }

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (autoSpin) {
      if (!spinningRef.current) spin();
    } else {
      clearTimeout(timeoutRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-blue-600 p-6 text-white">
      <div className="w-full max-w-md bg-gradient-to-br from-blue-900 to-purple-800 rounded-2xl p-4 shadow-2xl border-2 border-blue-400">
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

        {/* Grid 3x3 */}
        <div className="grid grid-rows-3 gap-2 bg-blue-950/50 p-3 rounded-lg mb-2">
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

        {/* NOVO: ganho da rodada logo abaixo do grid */}
        <div className="mb-4 text-center">
          {lastWin > 0 ? (
            <span className="inline-block px-3 py-1 rounded-full bg-yellow-300 text-purple-800 font-bold text-sm shadow-md">
              R$ {lastWin.toFixed(2)}
            </span>
          ) : (
            <span className="inline-block px-3 py-1 rounded-full bg-gray-700 text-gray-200 text-xs">
              
            </span>
          )}
        </div>

        {/* Saldo / aposta / último ganho */}
        <div className="flex justify-between items-center mb-3 text-sm">
          <div>
            <div className="text-xs text-gray-300">Saldo</div>
            <div className="font-bold">R$ {balance.toFixed(2)}</div>
          </div>

          <div>
            <div className="text-xs text-gray-300">Aposta:</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setBet((b) => Math.max(1, Math.round((b - 1) * 100) / 100))
                }
                className="px-2 py-1 bg-purple-700 rounded"
              >
                −
              </button>
              <input
                type="number"
                step="0.1"
                min="1"
                value={bet}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setBet(
                    Number.isFinite(v)
                      ? Math.max(1, Math.round(v * 100) / 100)
                      : 1
                  );
                }}
                className="w-20 text-center bg-transparent"
              />
              <button
                onClick={() =>
                  setBet((b) => Math.round((b + 1) * 100) / 100)
                }
                className="px-2 py-1 bg-purple-700 rounded"
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
            onClick={() => setAutoSpin((a) => !a)}
            className={`justify-self-start px-3 py-2 rounded-xl font-bold ${
              autoSpin ? "bg-green-500" : "bg-gray-600 hover:bg-gray-700"
            }`}
          >
            Auto {autoSpin ? "ON" : "OFF"}
          </button>

          <button
            onClick={spin}
            disabled={isSpinning || balance < bet}
            className={`justify-self-center w-20 h-20 rounded-full flex items-center justify-center text-lg font-extrabold transition transform ${
              isSpinning || balance < bet
                ? "bg-gray-500 text-gray-200 cursor-not-allowed"
                : "bg-yellow-300 text-purple-700 hover:scale-105 shadow-lg"
            }`}
          >
            {isSpinning ? "..." : "SPIN"}
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
  );
}