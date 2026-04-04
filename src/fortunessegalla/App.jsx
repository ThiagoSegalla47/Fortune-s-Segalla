import React, { useState, useEffect, useRef } from "react";

const SYMBOLS = ["🐉", "🍀", "💰", "🔔", "🍒", "⭐", "💎"];

const BET_VALUES = [
  0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0,
  8.0, 12.0, 15.0, 16.0, 20.0, 24.0, 28.0, 30.0, 32.0,
  36.0, 40.0, 45.0, 50.0, 75.0, 100.0, 120.0, 150.0, 250.0, 500.0,
];

const AUTOSPIN_OPTIONS = [10, 30, 80, 1000];

const MULTIPLIER_REEL_ITEMS = [
  null, 2, null, 5, null, 10, null, 2, null, 5, null, 10, null,
];

function getRandomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function getRandomMultiplierResult() {
  const r = Math.random();
  if (r < 0.005) return 10;
  if (r < 0.04) return 5;
  if (r < 0.22) return 2;
  return null;
}

function createRandomGrid() {
  return Array.from({ length: 3 }).map(() =>
    Array.from({ length: 3 }).map(() => getRandomSymbol())
  );
}

function createGuaranteedWinGrid() {
  const grid = createRandomGrid();
  const lineType = Math.floor(Math.random() * 5); // 0-2 rows, 3 diag1, 4 diag2
  const targetSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  if (lineType <= 2) {
    const r = lineType;
    grid[r][0] = targetSymbol;
    grid[r][1] = Math.random() < 0.15 ? "💎" : targetSymbol;
    grid[r][2] = Math.random() < 0.15 ? "💎" : targetSymbol;
  } else if (lineType === 3) {
    grid[0][0] = targetSymbol;
    grid[1][1] = Math.random() < 0.15 ? "💎" : targetSymbol;
    grid[2][2] = Math.random() < 0.15 ? "💎" : targetSymbol;
  } else {
    grid[0][2] = targetSymbol;
    grid[1][1] = Math.random() < 0.15 ? "💎" : targetSymbol;
    grid[2][0] = Math.random() < 0.15 ? "💎" : targetSymbol;
  }

  return grid;
}

export default function SlotMachine() {
  const [grid, setGrid] = useState(() => createRandomGrid());

  const [balance, setBalance] = useState(1000);
  const [betIndex, setBetIndex] = useState(5);
  const bet = BET_VALUES[betIndex];

  const [lastWin, setLastWin] = useState(0);
  const [multiplier, setMultiplier] = useState(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [guaranteedWinEnabled, setGuaranteedWinEnabled] = useState(false);

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

  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [threatEventActive, setThreatEventActive] = useState(false);

  const [multiplierOrbOffset, setMultiplierOrbOffset] = useState(0);
  const [isMultiplierOrbSpinning, setIsMultiplierOrbSpinning] = useState(false);

  const balanceRef = useRef(balance);
  const betRef = useRef(bet);
  const autoSpinRemainingRef = useRef(autoSpinRemaining);
  const spinningRef = useRef(isSpinning);
  const guaranteedWinEnabledRef = useRef(guaranteedWinEnabled);

  const timeoutRef = useRef(null);
  const animationRef = useRef(null);
  const threatTimeoutRef = useRef(null);

  const spinSoundRef = useRef(null);
  const specialEventSoundRef = useRef(null);
  const bigWinSoundRef = useRef(null);
  const bgMusicRef = useRef(null);
  const bgMusicStartedRef = useRef(false);

  const SYMBOL_PRIZES = {
    "⭐": 0.2,
    "🍒": 0.5,
    "💰": 0.75,
    "🔔": 1,
    "🍀": 2,
    "🐉": 4,
    "💎": 8,
  };

  const ORB_ITEM_WIDTH = 44;
  const ORB_VIEW_WIDTH = 44;

  const effectiveBet = guaranteedWinEnabled ? bet * 5 : bet;

  useEffect(() => {
    spinSoundRef.current = new Audio("/sounds/spin.mp3");
    specialEventSoundRef.current = new Audio("/sounds/special.mp3");
    bigWinSoundRef.current = new Audio("/sounds/bigwin.mp3");
    bgMusicRef.current = new Audio("/sounds/bg-music.mp3");

    if (bgMusicRef.current) {
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = 0.35;
    }

    return () => {
      if (spinSoundRef.current) spinSoundRef.current.pause();
      if (specialEventSoundRef.current) specialEventSoundRef.current.pause();
      if (bigWinSoundRef.current) bigWinSoundRef.current.pause();
      if (bgMusicRef.current) bgMusicRef.current.pause();
    };
  }, []);

  const playSpinSound = () => {
    const a = spinSoundRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play();
    } catch {}
  };

  const playSpecialEventSound = () => {
    const a = specialEventSoundRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play();
    } catch {}
  };

  const stopSpecialEventSound = () => {
    const a = specialEventSoundRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {}
  };

  const playBigWinSound = () => {
    const a = bigWinSoundRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play();
    } catch {}
  };

  const ensureBgMusicPlaying = () => {
    const a = bgMusicRef.current;
    if (!a || bgMusicStartedRef.current) return;
    try {
      a.play();
      bgMusicStartedRef.current = true;
    } catch {}
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

  useEffect(() => {
    guaranteedWinEnabledRef.current = guaranteedWinEnabled;
  }, [guaranteedWinEnabled]);

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

    const duration = 2000;
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [winOverlay.visible, winOverlay.finalAmount]);

  function startMultiplierOrbSpin(finalMultiplier, duration) {
    setIsMultiplierOrbSpinning(true);

    const indices = MULTIPLIER_REEL_ITEMS
      .map((item, idx) => ({ item, idx }))
      .filter((entry) => entry.item === finalMultiplier)
      .map((entry) => entry.idx);

    const targetIndex = indices[Math.floor(Math.random() * indices.length)];
    const totalItems = MULTIPLIER_REEL_ITEMS.length;
    const extraLoops = turbo ? 18 : 26;
    const targetOffset = -((extraLoops * totalItems + targetIndex) * ORB_ITEM_WIDTH);

    requestAnimationFrame(() => {
      setMultiplierOrbOffset(targetOffset);
    });

    setTimeout(() => {
      setIsMultiplierOrbSpinning(false);
    }, duration + 50);
  }

  function buildFinalGrid() {
    if (guaranteedWinEnabledRef.current) {
      return createGuaranteedWinGrid();
    }
    return createRandomGrid();
  }

  function spin() {
    if (spinningRef.current) return;

    const spinCost = guaranteedWinEnabledRef.current
      ? betRef.current * 5
      : betRef.current;

    if (balanceRef.current < spinCost) {
      if (autoSpinRemainingRef.current > 0) setAutoSpinRemaining(0);
      return;
    }

    playSpinSound();

    setIsSpinning(true);
    spinningRef.current = true;

    setHighlightedCells(new Set());
    setWinOverlay((prev) => ({ ...prev, visible: false }));
    setWinOverlayAmount(0);
    setMultiplier(null);

    setSpecialEvent({
      active: false,
      phase: "none",
      targetSymbol: null,
      spinsLeft: 0,
    });

    setThreatEventActive(false);
    stopSpecialEventSound();

    if (threatTimeoutRef.current) clearTimeout(threatTimeoutRef.current);

    setBalance((prev) => {
      const next = Math.round((prev - spinCost) * 100) / 100;
      balanceRef.current = next;
      return next;
    });

    const frames = turbo ? 6 : 12;
    const frameDelay = turbo ? 50 : 100;
    const baseSpinDuration = frames * frameDelay;

    let frame = 0;
    clearTimeout(timeoutRef.current);

    const triggerSpecial = Math.random() < 0.05;
    const triggerThreat = !triggerSpecial && Math.random() < 0.07;
    const rolledMultiplier = getRandomMultiplierResult();

    startMultiplierOrbSpin(rolledMultiplier, baseSpinDuration);

    if (triggerThreat) {
      setThreatEventActive(true);
      threatTimeoutRef.current = setTimeout(() => {
        setThreatEventActive(false);
      }, Math.max(250, frameDelay * (frames - 3)));
    }

    function frameStep() {
      setGrid(createRandomGrid());

      frame++;
      if (frame < frames) {
        timeoutRef.current = setTimeout(frameStep, frameDelay);
      } else {
        const finalGrid = buildFinalGrid();
        setGrid(finalGrid);
        setThreatEventActive(false);
        setMultiplier(rolledMultiplier);

        if (triggerSpecial) {
          const nonWildSymbols = SYMBOLS.filter((s) => s !== "💎");
          const targetSymbol =
            nonWildSymbols[Math.floor(Math.random() * nonWildSymbols.length)];

          const eventState = {
            active: true,
            phase: "fading",
            targetSymbol,
            spinsLeft: 6,
          };
          setSpecialEvent(eventState);

          playSpecialEventSound();
          startSpecialFading(eventState, finalGrid, rolledMultiplier, spinCost);
        } else {
          const { payout, winCells } = calculateWinWithHighlights(
            finalGrid,
            spinCost,
            rolledMultiplier
          );
          finishSpinWithPayout(finalGrid, payout, winCells, spinCost);
        }
      }
    }

    timeoutRef.current = setTimeout(frameStep, frameDelay);
  }

  function startSpecialFading(initialState, baseGrid, activeMultiplier, spinCost) {
    let state = { ...initialState };
    let currentGrid = baseGrid;

    const spinForeverStep = () => {
      currentGrid = createRandomGrid();
      setGrid(currentGrid);

      if (state.active && state.phase === "fading") {
        timeoutRef.current = setTimeout(spinForeverStep, 250);
      }
    };

    timeoutRef.current = setTimeout(spinForeverStep, 0);

    setTimeout(() => {
      state = { ...state, phase: "active" };
      setSpecialEvent(state);
      runSpecialEventActive(state, currentGrid, activeMultiplier, spinCost);
    }, 1500);
  }

  function runSpecialEventActive(initialState, initialGrid, activeMultiplier, spinCost) {
    let state = { ...initialState };
    let currentGrid = initialGrid;
    const slowDelay = 450;

    const spinStep = () => {
      if (!state.active || state.spinsLeft <= 0) {
        const { payout, winCells } = calculateWinWithHighlights(
          currentGrid,
          spinCost,
          activeMultiplier
        );
        finishSpinWithPayout(currentGrid, payout, winCells, spinCost);

        setSpecialEvent({
          active: false,
          phase: "none",
          targetSymbol: null,
          spinsLeft: 0,
        });

        stopSpecialEventSound();
        return;
      }

      const newGrid = currentGrid.map((row) =>
        row.map((sym) => {
          if (sym === state.targetSymbol || sym === "💎") return sym;
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
          spinCost,
          activeMultiplier
        );
        const boosted = Math.round(payout * 10 * 100) / 100;
        finishSpinWithPayout(newGrid, boosted, winCells, spinCost);

        setSpecialEvent({
          active: false,
          phase: "none",
          targetSymbol: null,
          spinsLeft: 0,
        });

        stopSpecialEventSound();
        return;
      }

      state = { ...state, spinsLeft: state.spinsLeft - 1 };
      setSpecialEvent(state);

      if (state.spinsLeft > 0) {
        timeoutRef.current = setTimeout(spinStep, slowDelay);
      } else {
        const { payout, winCells } = calculateWinWithHighlights(
          newGrid,
          spinCost,
          activeMultiplier
        );
        finishSpinWithPayout(newGrid, payout, winCells, spinCost);

        setSpecialEvent({
          active: false,
          phase: "none",
          targetSymbol: null,
          spinsLeft: 0,
        });

        stopSpecialEventSound();
      }
    };

    timeoutRef.current = setTimeout(spinStep, slowDelay);
  }

  function finishSpinWithPayout(finalGrid, payout, winCells, spinCost) {
    setHighlightedCells(winCells);
    setLastWin(payout);

    if (payout > 0) {
      setBalance((prev) => {
        const next = Math.round((prev + payout) * 100) / 100;
        balanceRef.current = next;
        return next;
      });

      const effectiveMult = payout / spinCost;

      if (effectiveMult >= 8) {
        let title = "BIG WIN";
        if (effectiveMult >= 10 && effectiveMult < 15) title = "SUPER WIN";
        else if (effectiveMult >= 15) title = "MEGA WIN";

        setWinOverlay({
          visible: true,
          title,
          finalAmount: payout,
        });

        playBigWinSound();

        setTimeout(() => {
          setWinOverlay((prev) => ({ ...prev, visible: false }));
        }, 2500);
      }
    }

    setIsSpinning(false);
    spinningRef.current = false;

    if (autoSpinRemainingRef.current > 0 && balanceRef.current >= spinCost) {
      setAutoSpinRemaining((prev) => prev - 1);
      timeoutRef.current = setTimeout(() => {
        if (autoSpinRemainingRef.current > 0 && !spinningRef.current) spin();
      }, turbo ? 150 : 700);
    } else {
      setAutoSpinRemaining(0);
    }
  }

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(threatTimeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const isFading = specialEvent.phase === "fading";
  const isEventActive = specialEvent.phase === "active";
  const dangerTheme = isFading || isEventActive || threatEventActive;

  const bgClass = dangerTheme
    ? "bg-gradient-to-b from-black to-red-800 transition-colors duration-500"
    : "bg-gradient-to-b from-black to-blue-600 transition-colors duration-500";

  const cardBgClass = dangerTheme
    ? "bg-gradient-to-br from-red-900 to-red-700 border-red-400"
    : "bg-gradient-to-br from-blue-900 to-purple-800 border-blue-400";

  const gridBgClass = dangerTheme ? "bg-red-950/60" : "bg-blue-950/50";

  const repeatedOrbItems = [
    ...MULTIPLIER_REEL_ITEMS,
    ...MULTIPLIER_REEL_ITEMS,
    ...MULTIPLIER_REEL_ITEMS,
    ...MULTIPLIER_REEL_ITEMS,
  ];

  const handleBetDown = () => {
    setBetIndex((idx) => Math.max(0, idx - 1));
  };

  const handleBetUp = () => {
    setBetIndex((idx) => Math.min(BET_VALUES.length - 1, idx + 1));
  };

  const openAutoSpinModal = () => {
    if (isSpinning) return;
    ensureBgMusicPlaying();
    setIsAutoModalOpen(true);
  };

  const handleSelectAutoSpin = (value) => {
    if (!AUTOSPIN_OPTIONS.includes(value)) return;
    if (balanceRef.current < effectiveBet) {
      setIsAutoModalOpen(false);
      return;
    }
    setIsAutoModalOpen(false);
    setAutoSpinRemaining(value);
    if (!spinningRef.current) spin();
  };

  const handleSpinButtonClick = () => {
    ensureBgMusicPlaying();
    if (autoSpinRemainingRef.current > 0 && !isSpinning) {
      setAutoSpinRemaining(0);
      clearTimeout(timeoutRef.current);
      return;
    }
    spin();
  };

  const handleToggleTurbo = () => {
    ensureBgMusicPlaying();
    setTurbo((t) => !t);
  };

  const handleToggleGuaranteedWin = () => {
    if (isSpinning) return;
    ensureBgMusicPlaying();
    setGuaranteedWinEnabled((prev) => !prev);
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

      {isAutoModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-gradient-to-br from-purple-900 to-blue-800 border border-pink-300 rounded-2xl p-4 w-72 shadow-2xl">
            <h3 className="text-center text-sm font-bold text-yellow-200 mb-3">
              Selecionar giros automáticos
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {AUTOSPIN_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectAutoSpin(opt)}
                  className="py-2 rounded-xl bg-gradient-to-b from-yellow-300 to-yellow-500 text-pink-900 text-sm font-bold shadow-[0_0_10px_rgba(250,204,21,0.7)] hover:scale-105 transition-transform"
                >
                  {opt} giros
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsAutoModalOpen(false)}
              className="w-full py-1.5 rounded-xl bg-pink-800/70 text-xs text-yellow-100 font-semibold hover:bg-pink-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className={`min-h-screen flex items-center justify-center p-4 text-white ${bgClass}`}>
        <div className={`w-full max-w-md rounded-2xl p-4 shadow-2xl border-2 ${cardBgClass}`}>
          <h2 className="text-center text-2xl font-extrabold mb-3">
            Fortune&apos;s Segalla
          </h2>

          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={`grid grid-rows-3 gap-2 ${gridBgClass} p-3 rounded-lg`}>
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
                            : dangerTheme
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

            <div className="flex flex-col items-center gap-2">
              <div className="text-[10px] uppercase tracking-[0.2em] text-yellow-200/80">
                Mult
              </div>

              <div className="relative w-24 h-24 rounded-full border-2 border-pink-300 bg-gradient-to-br from-fuchsia-500 via-purple-700 to-indigo-900 shadow-[0_0_18px_rgba(244,114,182,0.35)] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-[7px] rounded-full border border-white/20 bg-black/25 backdrop-blur-sm" />
                <div className="absolute inset-0 rounded-full pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_70%_75%,rgba(255,255,255,0.08),transparent_30%)]" />

                <div className="absolute z-10 w-[44px] h-[28px] rounded-full overflow-hidden border border-yellow-200/60 bg-black/55 shadow-inner">
                  <div
                    className="flex items-center h-full"
                    style={{
                      width: `${repeatedOrbItems.length * ORB_ITEM_WIDTH}px`,
                      transform: `translateX(${multiplierOrbOffset + ORB_VIEW_WIDTH / 2 - ORB_ITEM_WIDTH / 2}px)`,
                      transition: isMultiplierOrbSpinning
                        ? `transform ${turbo ? 0.35 : 0.75}s cubic-bezier(0.16, 1, 0.3, 1)`
                        : "none",
                    }}
                  >
                    {repeatedOrbItems.map((item, idx) => (
                      <div
                        key={`${item}-${idx}`}
                        className="w-[44px] min-w-[44px] h-full flex items-center justify-center text-sm font-extrabold"
                      >
                        {item ? (
                          <span className="text-yellow-200 drop-shadow-[0_0_8px_rgba(250,204,21,0.55)]">
                            {item}x
                          </span>
                        ) : (
                          <span className="text-white/10">•</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute z-20 h-[38px] w-[2px] bg-yellow-300/80 shadow-[0_0_8px_rgba(250,204,21,0.8)] rounded-full" />
              </div>

              <div className="h-4 text-xs font-bold text-yellow-200">
                {multiplier ? `${multiplier}x` : "—"}
              </div>

              <button
                onClick={handleToggleGuaranteedWin}
                disabled={isSpinning}
                className={`mt-1 w-24 rounded-full border-2 px-2 py-1 text-[11px] font-extrabold tracking-wider transition-all ${
                  guaranteedWinEnabled
                    ? "bg-green-500 border-green-200 text-white shadow-[0_0_14px_rgba(34,197,94,0.7)]"
                    : "bg-red-600 border-red-200 text-white shadow-[0_0_14px_rgba(220,38,38,0.55)]"
                } ${isSpinning ? "opacity-60 cursor-not-allowed" : "hover:scale-105"}`}
              >
                {guaranteedWinEnabled ? "ON" : "OFF"}
              </button>

              <div className="text-[10px] text-center text-yellow-100/80 leading-tight max-w-[90px]">
                Ganho Certo
              </div>
            </div>
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

          <div className="flex justify-between items-center mb-3 text-xs">
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-gray-300">Saldo</span>
              <span className="font-bold text-sm">
                R$ {balance.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-300">
                Aposta {guaranteedWinEnabled ? "(x5)" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBetDown}
                  disabled={betIndex === 0}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-700 border border-purple-300 shadow-md text-xs disabled:opacity-40"
                >
                  −
                </button>
                <span className="min-w-[88px] text-center text-sm font-bold">
                  R$ {effectiveBet.toFixed(2)}
                </span>
                <button
                  onClick={handleBetUp}
                  disabled={betIndex === BET_VALUES.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-700 border border-purple-300 shadow-md text-xs disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-300">Último ganho</span>
              <span className="font-bold text-sm">
                R$ {lastWin.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-3 pb-2 px-3 bg-gradient-to-t from-purple-900 to-blue-700 rounded-[40px] border border-pink-300 shadow-inner">
            <div className="flex items-center justify-between">
              <button
                onClick={handleToggleTurbo}
                className="flex flex-col items-center text-yellow-200 text-[11px] font-semibold"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${
                    turbo
                      ? "bg-yellow-300 text-pink-900 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.9)]"
                      : "bg-pink-800/60 border-pink-200"
                  }`}
                >
                  <span className="text-xs font-bold">⚡</span>
                </div>
                <span className="mt-1 tracking-wide">TURBO</span>
              </button>

              <button
                onClick={handleSpinButtonClick}
                disabled={(isSpinning && autoSpinRemaining === 0) || balance < effectiveBet}
                className="relative flex flex-col items-center -mt-4"
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center border-[3px] border-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.9)] bg-gradient-to-b from-yellow-400 to-yellow-700 ${
                    (isSpinning && autoSpinRemaining === 0) || balance < effectiveBet
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:scale-105 transition-transform"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-yellow-200 flex items-center justify-center text-lg font-extrabold text-yellow-100">
                    {spinButtonLabel === "..."
                      ? "•••"
                      : spinButtonLabel.startsWith("AUTO")
                      ? "A"
                      : "S"}
                  </div>
                </div>
                <span className="mt-1 text-[11px] font-semibold text-yellow-200 tracking-widest">
                  {spinButtonLabel.startsWith("AUTO") ? spinButtonLabel : "SPIN"}
                </span>
              </button>

              <button
                onClick={openAutoSpinModal}
                disabled={isSpinning}
                className="flex flex-col items-center text-yellow-200 text-[11px] font-semibold disabled:opacity-50"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-pink-200 bg-pink-800/60">
                  <span className="text-xs font-bold">▶</span>
                </div>
                <span className="mt-1 tracking-wide">AUTO</span>
              </button>
            </div>
          </div>

          <div className="mt-2 text-center text-[10px] text-gray-300"></div>
        </div>
      </div>
    </>
  );
}