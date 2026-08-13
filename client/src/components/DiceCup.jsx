import React, { useEffect, useState, useRef } from 'react';
import { Lock, Unlock, Sparkles, Target, Dices, Hand, Undo2 } from 'lucide-react';

const PIP_POSITIONS = {
  1: ['col-start-2 row-start-2'],
  2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
  3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
  4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
  5: [
    'col-start-1 row-start-1',
    'col-start-3 row-start-1',
    'col-start-2 row-start-2',
    'col-start-1 row-start-3',
    'col-start-3 row-start-3',
  ],
  6: [
    'col-start-1 row-start-1',
    'col-start-3 row-start-1',
    'col-start-1 row-start-2',
    'col-start-3 row-start-2',
    'col-start-1 row-start-3',
    'col-start-3 row-start-3',
  ],
};

export default function DiceCup({
  turnState,
  isMyTurn,
  onToggleKeep,
  isRolling,
  activeCanto,
  pendingCantoData,
  onTriggerRoll,
}) {
  const {
    dice = [1, 1, 1, 1, 1],
    keptDice = [false, false, false, false, false],
    isReal,
    rollsLeft,
    hasRolledThisTurn,
    cantoFailed,
    cantoResolution,
  } = turnState;

  const [isShakingMotion, setIsShakingMotion] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cupPos, setCupPos] = useState({ x: 0, y: 0 });

  // Track indices that were ALREADY docked in previous rolls
  const [dockedIndices, setDockedIndices] = useState([]);

  const lastMousePos = useRef({ x: 0, y: 0, time: Date.now() });

  const canRollNow = isMyTurn && rollsLeft > 0 && !cantoFailed && !isRolling && !cantoResolution?.active;

  // When a roll completes, update dockedIndices to lock previously kept dice in top dock
  useEffect(() => {
    if (!hasRolledThisTurn) {
      setDockedIndices([]);
    } else {
      // Lock all dice that were kept prior to this roll
      setDockedIndices((prev) => {
        const next = [...prev];
        keptDice.forEach((isKept, idx) => {
          if (isKept && !next.includes(idx)) {
            // Only dock if it was kept before this roll arrived
          }
        });
        return next;
      });
    }
  }, [hasRolledThisTurn, rollsLeft]);

  // When user starts shaking/dragging for the next roll, move ALL currently selected kept dice to the docked top area!
  const handleStartShake = () => {
    const newlyKept = dice.map((_, idx) => idx).filter((idx) => keptDice[idx]);
    setDockedIndices(newlyKept);
  };

  // Mobile Device Motion API (Shake to Roll Mobile Acceleration Detection)
  useEffect(() => {
    if (!canRollNow) return;

    let lastX = null;
    let lastY = null;
    let lastZ = null;
    let lastTime = Date.now();
    let shakeTimeout = null;

    const handleMotion = (event) => {
      const current = event.accelerationIncludingGravity || event.acceleration;
      if (!current) return;

      const currentTime = Date.now();
      const diffTime = currentTime - lastTime;

      if (diffTime > 80) {
        const x = current.x || 0;
        const y = current.y || 0;
        const z = current.z || 0;

        if (lastX !== null) {
          const speed = ((Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ)) / diffTime) * 1000;

          if (speed > 8) {
            handleStartShake();
            setIsShakingMotion(true);
            if (navigator.vibrate) navigator.vibrate([40, 20, 40]);

            clearTimeout(shakeTimeout);
            shakeTimeout = setTimeout(() => {
              setIsShakingMotion(false);
              if (onTriggerRoll) onTriggerRoll();
            }, 600);
          }
        }

        lastX = x;
        lastY = y;
        lastZ = z;
        lastTime = currentTime;
      }
    };

    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then((resp) => {
          if (resp === 'granted') {
            window.addEventListener('devicemotion', handleMotion, false);
          }
        })
        .catch(() => {});
    } else if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion, false);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion, false);
      }
      clearTimeout(shakeTimeout);
    };
  }, [canRollNow, onTriggerRoll, keptDice]);

  // Global PC Mouse & Touch Drag Handlers (1-Click Instant Release)
  const startDragGesture = (clientX, clientY) => {
    if (!canRollNow) return;

    handleStartShake();
    setIsDragging(true);
    lastMousePos.current = { x: clientX, y: clientY, time: Date.now() };

    const handleGlobalMove = (e) => {
      const curX = e.clientX ?? e.touches?.[0]?.clientX ?? clientX;
      const curY = e.clientY ?? e.touches?.[0]?.clientY ?? clientY;
      const now = Date.now();
      const dt = now - lastMousePos.current.time;

      if (dt > 25) {
        const dx = curX - lastMousePos.current.x;
        const dy = curY - lastMousePos.current.y;
        const speed = (Math.abs(dx) + Math.abs(dy)) / dt;

        setCupPos((prev) => ({
          x: Math.max(-180, Math.min(180, prev.x + dx * 0.85)),
          y: Math.max(-140, Math.min(140, prev.y + dy * 0.85)),
        }));

        if (speed > 0.3) {
          setIsShakingMotion(true);
          if (navigator.vibrate) navigator.vibrate([25, 15, 25]);
        }

        lastMousePos.current = { x: curX, y: curY, time: now };
      }
    };

    const handleGlobalEnd = () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);

      setIsDragging(false);
      setIsShakingMotion(false);
      setCupPos({ x: 0, y: 0 });

      if (onTriggerRoll) {
        onTriggerRoll();
      }
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMove);
    window.addEventListener('touchend', handleGlobalEnd);
  };

  // Dice state definitions:
  // - Top Dock: Shows dice indices that were locked into Zona Segura
  // - Table Tray: Shows active dice indices for the current roll
  const isDiceInCup = isRolling || isShakingMotion || isDragging || !hasRolledThisTurn;
  
  // Docked indices (in top Zona Segura)
  const currentDockedIndices = dice.map((_, idx) => idx).filter((idx) => dockedIndices.includes(idx) && keptDice[idx]);
  
  // Active table indices (on the felt table tray - NOT yet docked!)
  const activeTableIndices = dice.map((_, idx) => idx).filter((idx) => !dockedIndices.includes(idx));

  const activeCantoLabel = pendingCantoData
    ? `Canto Elegido: ${pendingCantoData.predictedSum} (${pendingCantoData.targetCategory.toUpperCase()})`
    : activeCanto
    ? `Canto Activo: ${typeof activeCanto === 'string' ? activeCanto.toUpperCase() : activeCanto}`
    : null;

  return (
    <div className="flex flex-col items-center justify-center p-1 relative select-none w-full min-h-[280px]">
      {/* 1. Top Zona Segura (DADOS GUARDADOS DE TIROS ANTERIORES) */}
      {hasRolledThisTurn && currentDockedIndices.length > 0 && (
        <div className="mb-3 px-4 py-2 rounded-2xl bg-zinc-950/90 border border-amber-400/90 shadow-gold-glow backdrop-blur-md flex items-center gap-3 z-30 animate-fade-in">
          <div className="flex items-center gap-1 text-[11px] uppercase font-black tracking-widest text-amber-300">
            <Lock className="w-3.5 h-3.5 text-amber-400" /> Zona Segura ({currentDockedIndices.length})
          </div>
          <div className="flex items-center gap-2">
            {currentDockedIndices.map((idx) => {
              const val = dice[idx];
              const canToggle = isMyTurn && hasRolledThisTurn && rollsLeft > 0 && !cantoFailed;

              return (
                <div
                  key={idx}
                  onClick={() => canToggle && onToggleKeep(idx)}
                  className="relative group cursor-pointer transform hover:scale-110 active:scale-95 transition-transform shrink-0"
                  title="Toca para devolver este dado a la mesa"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 aspect-square shrink-0 rounded-xl p-1 bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 text-zinc-950 border-2 border-amber-400 shadow-2d-die-kept grid grid-cols-3 grid-rows-3 items-center justify-items-center ring-2 ring-amber-400/50">
                    {PIP_POSITIONS[val]?.map((posClass, pIdx) => (
                      <span key={pIdx} className={`w-1.5 h-1.5 aspect-square rounded-full ${posClass} bg-amber-950 die-pip-sunken-kept`} />
                    ))}
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-amber-500 rounded-full text-zinc-950 shadow">
                    <Undo2 className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges Overlay (Real vs Armada / Active Canto) */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-3 z-10">
        {hasRolledThisTurn && (
          <div>
            {isReal ? (
              <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black text-xs shadow-gold-glow flex items-center gap-1 border border-yellow-200 animate-bounce-short">
                <Sparkles className="w-3.5 h-3.5 fill-current text-zinc-950" /> ¡TIRO REAL!
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-zinc-900/90 text-zinc-300 font-semibold text-xs border border-zinc-700/80 shadow backdrop-blur-md">
                Jugada Armada
              </span>
            )}
          </div>
        )}

        {activeCantoLabel && (
          <div>
            <span
              className={`px-3.5 py-1 rounded-full text-xs font-black flex items-center gap-1 border shadow-lg ${
                cantoFailed
                  ? 'bg-rose-950/90 text-rose-300 border-rose-600 shadow-rose-900/50'
                  : 'bg-amber-950/90 text-amber-300 border-amber-400 animate-pulse shadow-gold-glow'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              {activeCantoLabel}
            </span>
          </div>
        )}
      </div>

      {/* 2.5D Cacho Leather Cup Graphic */}
      {(isDiceInCup || rollsLeft > 0) && (
        <div
          onMouseDown={(e) => startDragGesture(e.clientX, e.clientY)}
          onTouchStart={(e) => e.touches[0] && startDragGesture(e.touches[0].clientX, e.touches[0].clientY)}
          style={{
            transform: `translate3d(${cupPos.x}px, ${cupPos.y}px, 0px)`,
          }}
          className={`relative mb-3 z-30 transition-transform duration-75 ${
            canRollNow ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'
          }`}
          title={canRollNow ? 'Mantén presionado y agita el vaso para tirar' : 'Cubilete Cacho'}
        >
          <div
            className={`w-36 h-40 sm:w-44 sm:h-48 rounded-b-[2.5rem] rounded-t-xl bg-gradient-to-b from-[#54250c] via-[#381606] to-[#1a0802] border-4 border-amber-900/90 shadow-2d-cup flex flex-col items-center justify-between transition-transform ${
              isRolling || isShakingMotion || isDragging ? 'animate-cup-shake scale-110' : ''
            }`}
          >
            {/* Leather Stitched Upper Rim */}
            <div className="w-full h-5 sm:h-6 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 border-b-2 border-amber-950/80 rounded-t-lg shadow-inner flex items-center justify-center">
              <div className="w-4/5 h-0.5 border-t border-dashed border-amber-500/40" />
            </div>

            {/* Golden Casino Emblem */}
            <div className="my-auto text-center px-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shadow-gold-glow">
                <Dices className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 stroke-[2.5]" />
              </div>
              <span className="text-2xl sm:text-3xl font-black font-cinzel text-gold-shine tracking-widest drop-shadow-lg block">
                CACHO
              </span>
            </div>

            {/* Leather Bottom Rim */}
            <div className="w-full h-4 sm:h-5 bg-zinc-950/90 rounded-b-[2rem] border-t border-amber-900/50 flex items-center justify-center">
              <div className="w-2/3 h-0.5 border-t border-dashed border-amber-700/30" />
            </div>
          </div>

          {/* Clean Short Helper Badge */}
          {canRollNow && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-40">
              <span className="px-3.5 py-1 rounded-full bg-black/90 backdrop-blur-md text-amber-300 border border-amber-400/90 text-xs font-bold flex items-center gap-1.5 shadow-gold-glow animate-pulse">
                <Hand className="w-3.5 h-3.5 text-amber-400" />
                <span>Agita o arrastra para tirar</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Active Dice Table Tray (DADOS DEL TIRO ACTUAL - SE QUEDAN EN SU SITIO AL MARCARSE!) */}
      {!isDiceInCup && hasRolledThisTurn && activeTableIndices.length > 0 ? (
        <div className="w-full max-w-lg glass-panel-luxury rounded-3xl p-4 sm:p-5 border border-emerald-500/20 shadow-2xl z-10 animate-fade-in">
          <div className="text-center mb-3">
            <span className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold font-mono">
              🔒 Toca para guardar (al agitar van a la zona segura)
            </span>
          </div>

          {/* Active Table Dice (Exact count for current roll, die stays in place when marked!) */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4.5">
            {activeTableIndices.map((idx) => {
              const val = dice[idx];
              const isKept = keptDice[idx];
              const canToggle = isMyTurn && hasRolledThisTurn && rollsLeft > 0 && !cantoFailed;

              return (
                <div
                  key={idx}
                  onClick={() => canToggle && onToggleKeep(idx)}
                  className={`relative group flex flex-col items-center transition-all transform shrink-0 ${
                    canToggle ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                  }`}
                  title={isKept ? 'Dado Guardado (se moverá arriba al agitar)' : 'Toca para guardar este dado'}
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 aspect-square shrink-0 rounded-2xl p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center transition-all transform ${
                      isKept
                        ? 'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 text-zinc-950 border-2 sm:border-3 border-amber-400 shadow-2d-die-kept scale-105 ring-2 sm:ring-4 ring-amber-400/60'
                        : 'bg-gradient-to-br from-amber-50 via-zinc-100 to-zinc-300 text-zinc-900 border-2 border-zinc-300 shadow-2d-die hover:border-amber-400/80'
                    }`}
                  >
                    {PIP_POSITIONS[val]?.map((posClass, pIdx) => (
                      <span
                        key={pIdx}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 aspect-square rounded-full shrink-0 ${posClass} ${
                          isKept ? 'bg-amber-950 die-pip-sunken-kept' : 'bg-zinc-900 die-pip-sunken'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="mt-1.5 flex items-center justify-center">
                    {isKept ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-400/60 text-[9px] sm:text-[10px] font-black flex items-center gap-0.5 shadow-sm">
                        <Lock className="w-2.5 h-2.5 text-amber-400" /> Guardado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-zinc-900/80 text-zinc-400 text-[9px] sm:text-[10px] font-medium flex items-center gap-0.5 border border-zinc-800 group-hover:text-amber-300 group-hover:border-amber-500/50">
                        <Unlock className="w-2.5 h-2.5" /> Libre
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : !hasRolledThisTurn ? (
        /* Prompt before initial roll */
        <div className="text-center mt-2 z-10">
          <span className="text-xs sm:text-sm font-bold font-cinzel text-gold-shine tracking-wider bg-black/85 px-4 py-1.5 rounded-full border border-amber-400/70 shadow-gold-glow">
            🎲 Agita o arrastra el Cacho para tirar
          </span>
        </div>
      ) : null}
    </div>
  );
}
