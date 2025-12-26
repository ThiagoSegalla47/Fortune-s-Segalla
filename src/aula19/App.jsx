import React, { useState, useEffect, useRef } from "react";

/**
 * Slot 3x3 - corrigido
 * - usa setBet (controle de aposta) para evitar warning do editor
 * - AutoSpin reescrito: só agenda próximo spin quando o atual terminar
 * - usa refs para evitar closures com estados obsoletos
 * - Turbo + WILD + multiplicador aleatório (maior chance de null)
 */

const SYMBOLS = ["🐉", "🍀", "💰", "🔔", "🍒", "⭐", "💎"];

const SYMBOL_PRIZES = {
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
  const [bet, setBet] = useState(10); // agora usa setBet no input
  const [lastWin, setLastWin] = useState(0);
  const [multiplier, setMultiplier] = useState(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);

  // refs para leitura/controle dentro de spin sem depender de closures
  const balanceRef = useRef(balance);
  const betRef = useRef(bet);
  const autoSpinRef = useRef(autoSpin);
  const spinningRef = useRef(isSpinning);
  const timeoutRef = useRef(null);

  // sincroniza refs com estados

  // Atualiza os prêmios conforme solicitado
  const SYMBOL_PRIZES = {
    "⭐": 0.2,   // Star
    "🍒": 0.5,   // Cherry
    "💰": 0.75,  // Bag
    "🔔": 1,     // Bell
    "🍀": 2,     // Lucky Clover
    "🐉": 4,     // Dragon
    "💎": 8      // Wild
  };
  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { betRef.current = bet; }, [bet]);
  useEffect(() => { autoSpinRef.current = autoSpin; }, [autoSpin]);
  useEffect(() => { spinningRef.current = isSpinning; }, [isSpinning]);

  // util: calcula prêmio por linhas e diagonais (WILD substitui)
  function calculateWin(finalGrid, baseBet, mult) {
    let payout = 0;

    // Verifica linhas (3 linhas horizontais)
    for (let r = 0; r < 3; r++) {
      const row = finalGrid[r];
      const nonWild = row.filter((s) => s !== "💎");

      // se só wilds -> grande prêmio
      if (nonWild.length === 0) {
        payout += baseBet * SYMBOL_PRIZES["💎"]; // 3 wilds -> prêmio especial
        continue;
      }

      // todos os símbolos não-wilds iguais?
      const target = nonWild[0];
      const allEqual = nonWild.every((s) => s === target);

      if (allEqual) {
        // prêmio personalizado para 3 iguais (com wilds substituindo)
        payout += baseBet * SYMBOL_PRIZES[target];
      }
    }

    // Verifica diagonal principal (top-left para bottom-right)
    const diag1 = [finalGrid[0][0], finalGrid[1][1], finalGrid[2][2]];
    const nonWildDiag1 = diag1.filter((s) => s !== "💎");

    if (nonWildDiag1.length === 0) {
      payout += baseBet * SYMBOL_PRIZES["💎"];
    } else {
      const target = nonWildDiag1[0];
      const allEqual = nonWildDiag1.every((s) => s === target);
      if (allEqual) {
        payout += baseBet * SYMBOL_PRIZES[target];
      }
    }

    // Verifica diagonal secundária (top-right para bottom-left)
    const diag2 = [finalGrid[0][2], finalGrid[1][1], finalGrid[2][0]];
    const nonWildDiag2 = diag2.filter((s) => s !== "💎");

    if (nonWildDiag2.length === 0) {
      payout += baseBet * SYMBOL_PRIZES["💎"];
    } else {
      const target = nonWildDiag2[0];
      const allEqual = nonWildDiag2.every((s) => s === target);
      if (allEqual) {
        payout += baseBet * SYMBOL_PRIZES[target];
      }
    }

    if (mult) payout *= mult;
    // arredonda para 2 casas
    return Math.round(payout * 100) / 100;
  }

  // função de spin: faz animação por alguns "frames" e finaliza,
  // depois, se autoSpin estiver ativo, agenda outro spin.
  function spin() {
    if (spinningRef.current) return; // já rodando
    if (balanceRef.current < betRef.current) {
      // se faltar saldo, desliga autos se estiver ligado
      if (autoSpinRef.current) setAutoSpin(false);
      return;
    }

    // inicia spin
    setIsSpinning(true);
    spinningRef.current = true;

    // debita aposta
    setBalance((prev) => {
      const next = Math.round((prev - betRef.current) * 100) / 100;
      balanceRef.current = next;
      return next;
    });

    // número de "frames" de rolagem
    const frames = turbo ? 6 : 12;
    const frameDelay = turbo ? 60 : 100; // intervalo entre frames

    let frame = 0;
    clearTimeout(timeoutRef.current);

    function frameStep() {
      // mostra símbolos aleatórios (efeito rolando)
      setGrid(
        Array.from({ length: 3 }).map(() =>
          Array.from({ length: 3 }).map(() => getRandomSymbol())
        )
      );

      frame++;
      if (frame < frames) {
        timeoutRef.current = setTimeout(frameStep, frameDelay);
      } else {
        // resultado final
        const finalGrid = Array.from({ length: 3 }).map(() =>
          Array.from({ length: 3 }).map(() => getRandomSymbol())
        );
        setGrid(finalGrid);

        const mult = getMultiplier();
        setMultiplier(mult);

        const winnings = calculateWin(finalGrid, betRef.current, mult);
        setLastWin(winnings);

        if (winnings > 0) {
          setBalance((prev) => {
            const next = Math.round((prev + winnings) * 100) / 100;
            balanceRef.current = next;
            return next;
          });
        }

        // fim do spin
        setIsSpinning(false);
        spinningRef.current = false;

        // se AutoSpin ainda ativo, agenda o próximo spin (pequena pausa entre spins)
        if (autoSpinRef.current) {
          const pauseBetween = turbo ? 150 : 700;
          timeoutRef.current = setTimeout(() => {
            // checa saldo antes de tentar novo spin
            if (autoSpinRef.current && balanceRef.current >= betRef.current) {
              spin();
            } else {
              // desliga auto se sem saldo
              setAutoSpin(false);
            }
          }, pauseBetween);
        }
      }
    }

    // começa animação
    timeoutRef.current = setTimeout(frameStep, frameDelay);
  }

  // limpa timeouts quando desmonta
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // quando usuário ativa AutoSpin manualmente, inicia um spin imediatamente
  useEffect(() => {
    if (autoSpin) {
      // se já girando, espere terminar (o próprio spin agenda o próximo)
      if (!spinningRef.current) spin();
    } else {
      // se desligou AutoSpin, garante que não existam timeouts pendentes que iniciam novo spin
      // (timeoutRef é usado tanto para animação quanto para agendamento)
      clearTimeout(timeoutRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpin]); // só reage à mudança do toggle

  // ----- UI -----
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-blue-600 p-6 text-white">
      <div className="w-full max-w-md bg-gradient-to-br from-blue-900 to-purple-800 rounded-2xl p-4 shadow-2xl border-2 border-blue-400">
        <h2 className="text-center text-2xl font-extrabold mb-3">Fortune's Segalla</h2>

        {/* Multiplicador visível quando sai */}
        <div className="text-center h-7 mb-2">
          {multiplier ? (
            <span className="text-yellow-300 font-bold">Multiplicador: x{multiplier}</span>
          ) : (
            <span className="text-gray-300">Multiplicador: —</span>
          )}
        </div>

        {/* Grid 3x3 */}
        <div className="grid grid-rows-3 gap-2 bg-blue-950/50 p-3 rounded-lg mb-4">
          {grid.map((row, r) => (
            <div key={r} className="flex justify-center gap-2">
              {row.map((sym, c) => (
                <div
                  key={c}
                  className={`w-20 h-20 flex items-center justify-center text-3xl rounded-lg bg-gradient-to-br from-pink-600/30 to-purple-800/30 border-2 ${
                    sym === "💎" ? "border-yellow-400" : "border-blue-500/60"
                  }`}
                >
                  {sym}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Saldo / aposta / último ganho */}
        <div className="flex justify-between items-center mb-3 text-sm">
          <div>
            <div className="text-xs text-gray-300">Saldo</div>
            <div className="font-bold">R$ {balance.toFixed(2)}</div>
          </div>

          <div>
            <div className="text-xs text-gray-300">Aposta</div>
            {/* input usa setBet (evita warning do editor) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBet((b) => Math.max(1, Math.round((b - 1) * 100) / 100))}
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
                  setBet(Number.isFinite(v) ? Math.max(1, Math.round(v * 100) / 100) : 1);
                }}
                className="w-20 text-center bg-transparent"
              />
              <button
                onClick={() => setBet((b) => Math.round((b + 1) * 100) / 100)}
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

        {/* Botões */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => spin()}
            disabled={isSpinning || balance < bet}
            className={`flex-1 py-3 rounded-xl font-bold transition ${
              isSpinning || balance < bet
                ? "bg-gray-500 text-gray-200 cursor-not-allowed"
                : "bg-yellow-300 text-purple-700 hover:scale-105"
            }`}
          >
            {isSpinning ? "Girando..." : "SPIN"}
          </button>

          <button
            onClick={() => setTurbo((t) => !t)}
            className={`px-3 py-2 rounded-xl font-bold ${
              turbo ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Turbo {turbo ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setAutoSpin((a) => !a)}
            className={`px-3 py-2 rounded-xl font-bold ${
              autoSpin ? "bg-green-500" : "bg-gray-600 hover:bg-gray-700"
            }`}
          >
            Auto {autoSpin ? "ON" : "OFF"}
          </button>
        </div>

        {/* Nota */}
        <div className="mt-3 text-xs text-gray-300">
       
        </div>
      </div>
    </div>
  );
}
