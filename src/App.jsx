import React, { useState, useEffect, useRef } from "react";

// SlotMachine.jsx
// Single-file React component (Tailwind CSS assumed in project)
// - 3x3 slot grid
// - Symbols represented by emojis / simple SVGs
// - Spin animation, balance, bet, payline detection
// - Modern aesthetic inspired by the provided image (pink/gold)

export default function SlotMachine() {
  const SYMBOLS = [
    { id: "dragon", label: "🐉", value: 10 },
    { id: "lotus", label: "🌺", value: 6 },
    { id: "gold", label: "🪙", value: 4 },
    { id: "pot", label: "🏺", value: 3 },
    { id: "seven", label: "7️⃣", value: 8 },
  ];

  const ROWS = 3;
  const COLS = 3;

  const [grid, setGrid] = useState(() => randomGrid());
  const [isSpinning, setIsSpinning] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [message, setMessage] = useState("");
  const [lastWin, setLastWin] = useState(0);

  const spinTimeout = useRef(null);

  function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  function randomGrid() {
    const g = Array.from({ length: ROWS }).map(() =>
      Array.from({ length: COLS }).map(() => randomSymbol())
    );
    return g;
  }

  function spin() {
    if (isSpinning) return;
    if (balance < bet) {
      setMessage("Saldo insuficiente — reduza a aposta");
      return;
    }

    setMessage("");
    setIsSpinning(true);
    setBalance((b) => b - bet);
    setLastWin(0);

    // simple staged animation: replace rows one by one
    const stages = [200, 500, 800];
    let stage = 0;

    function step() {
      setGrid((g) =>
        g.map((row, rIdx) =>
          row.map((cell) => (rIdx <= stage ? randomSymbol() : cell))
        )
      );

      if (stage < stages.length - 1) {
        stage++;
        spinTimeout.current = setTimeout(step, stages[stage]);
      } else {
        // final result
        const result = randomGrid();
        setGrid(result);
        setIsSpinning(false);
        const win = evaluateGrid(result);
        if (win > 0) {
          setBalance((b) => b + win);
          setMessage(`Você ganhou R$ ${win}!`);
          setLastWin(win);
        } else {
          setMessage("Tente a sorte de novo!");
        }
      }
    }

    spinTimeout.current = setTimeout(step, stages[stage]);
  }

  function evaluateGrid(g) {
    // Paylines: 3 horizontals and 2 diagonals (like many classic slots)
    // If all symbols in a line match => win = bet * symbol.value * multiplier
    let totalWin = 0;

    const lines = [];
    // horizontals
    for (let r = 0; r < ROWS; r++) lines.push(g[r]);
    // diagonals
    lines.push([g[0][0], g[1][1], g[2][2]]);
    lines.push([g[0][2], g[1][1], g[2][0]]);

    lines.forEach((line) => {
      const first = line[0].id;
      if (line.every((s) => s.id === first)) {
        const symbolValue = line[0].value;
        // bonus for dragon triple
        const multiplier = first === "dragon" ? 5 : 2;
        totalWin += bet * symbolValue * multiplier;
      }
    });

    // jackpot: all nine equal
    const allSame = g.flat().every((s) => s.id === g[0][0].id);
    if (allSame) totalWin += bet * g[0][0].value * 20; // big bonus

    return totalWin;
  }

  useEffect(() => {
    return () => clearTimeout(spinTimeout.current);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-600 to-gray-900 p-6">
      <div className="w-full max-w-3xl">
        <div className="bg-blue-300 rounded-2xl shadow-2xl p-4 border-4 border-black-300">
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center text-2xl shadow-md">🐲</div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Fortune's Segalla</h1>
                <p className="text-sm text-gray-700">3x3 - Multi-payline</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-600">Saldo</div>
              <div className="text-xl font-bold">R$ {balance}</div>
            </div>
          </header>

          {/* Slots area */}
          <div className="bg-blue-50/80 rounded-xl p-4 border-4 border-pink-200 shadow-inner">
            <div className="grid grid-cols-3 gap-3 p-3 bg-gradient-to-b from-pink-100 to-pink-50 rounded-lg">
              {grid.flat().map((cell, idx) => (
                <div
                  key={idx}
                  className={`aspect-square flex items-center justify-center rounded-lg text-4xl font-extrabold transform transition-transform duration-300 ${
                    isSpinning ? "scale-95 opacity-80" : "scale-100"
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-md border-2 border-yellow-200">
                    <span className="select-none">{cell.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Decorative top area can show multipliers like the original image */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <div className="px-3 py-1 rounded-full bg-blue-300 border border-black font-semibold">x2</div>
                <div className="px-3 py-1 rounded-full bg-blue-300 border border-black font-semibold">x2</div>
                <div className="px-3 py-1 rounded-full bg-blue-300 border border-black font-semibold">x2</div>
              </div>

              <div className="text-sm text-gray-600">Rodada: <span className="font-bold">4</span></div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-xs text-gray-600">Aposta</div>
                <input
                  type="number"
                  min={1}
                  value={bet}
                  onChange={(e) => setBet(Math.max(1, Number(e.target.value) || 1))}
                  className="w-28 p-2 rounded-md border-2 border-blue-300 bg-blue-200 text-center"
                />
              </div>

              <div>
                <div className="text-xs text-gray-900">Último prêmio</div>
                <div className="font-bold">R$ {lastWin}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setGrid(randomGrid()); setMessage(""); }}
                disabled={isSpinning}
                className="px-3 py-2 rounded-lg bg-white/80 border-2 border-blue-200 shadow hover:scale-105 transition-transform disabled:opacity-50"
              >
                Quick Shuffle
              </button>

              <button
                onClick={spin}
                disabled={isSpinning}
                className={`px-6 py-3 rounded-xl text-white font-extrabold shadow-lg transition-transform disabled:opacity-50 ${
                  isSpinning ? "bg-gray-400" : "bg-gradient-to-r from-blue-600 to-green-500"
                }`}
              >
                {isSpinning ? "Girando..." : "SPIN"}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
            <div>{message}</div>
            <div>Linhas pagas: 5</div>
          </div>

          {/* Footer decorative area similar to original image */}
          <footer className="mt-4 p-3 rounded-lg bg-gradient-to-r from-pink-100 to-yellow-50 border-t-2 border-pink-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm">Banco:</div>
              <div className="font-bold">R$ 10.483,00</div>
            </div>

            <div className="text-sm">Tema inspirado — cores quentes, dragões, brilho.</div>
          </footer>
        </div>
      </div>
    </div>
  );
}
