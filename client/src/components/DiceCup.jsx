import React, { useEffect, useState, useRef } from 'react';
import { Lock, Unlock, Sparkles, Target, Dices, Smartphone, Move } from 'lucide-react';

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
  const [isDraggingMouse, setIsDraggingMouse] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0, time: Date.now() });

  const canRollNow = isMyTurn && rollsLeft > 0 && !cantoFailed && !isRolling && !cantoResolution?.active;

  // Device Motion API (Shake to Roll Mobile Detection)
  useEffect(() => {
    if (!canRollNow) return;

    let lastX = null;
    let lastY = null;
    let lastZ = null;
    let lastTime = Date.now();
    let shakeTimeout = null;

    const handleMotion = (event) => {
      const current = event.accelerationIncludingGravity;
      if (!current) return;

      const currentTime = Date.now();
      const diffTime = currentTime - lastTime;

      if (diffTime > 100) {
        const x = current.x || 0;
        const y = current.y || 0;
        const z = current.z || 0;

        if (lastX !== null) {
          const speed = (Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ)) / diffTime * 1000;

          if (speed > 16) {
            setIsShakingMotion(true);
            if (navigator.vibrate) navigator.vibrate([40, 30, 40]);

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

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion, false);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion, false);
      }
      clearTimeout(shakeTimeout);
    };
  }, [canRollNow, onTriggerRoll]);

  // PC Mouse Drag & Shake Gesture Handlers
  const handleMouseDown = (e) => {
    if (!canRollNow) return;
    setIsDraggingMouse(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingMouse || !canRollNow) return;
    const now = Date.now();
    const dt = now - lastMousePos.current.time;
    if (dt > 50) {
      const dx = Math.abs(e.clientX - lastMousePos.current.x);
      const dy = Math.abs(e.clientY - lastMousePos.current.y);
      const speed = (dx + dy) / dt;

      if (speed > 0.5) {
        setIsShakingMotion(true);
        if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
    }
  };

  const handleMouseUp = () => {
    if (isDraggingMouse && canRollNow) {
      setIsDraggingMouse(false);
      setIsShakingMotion(false);
      if (onTriggerRoll) onTriggerRoll();
    }
  };

  // Separate kept (saved) dice and active rolling dice
  const savedDiceIndices = dice.map((_, idx) => idx).filter((idx) => keptDice[idx]);
  const activeDiceIndices = dice.map((_, idx) => idx).filter((idx) => !keptDice[idx]);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="flex flex-col items-center justify-center p-1 relative select-none w-full"
    >
      {/* Floating Dock for Saved/Kept Dice (Organizados en la Esquina Superior) */}
      {hasRolledThisTurn && savedDiceIndices.length > 0 && (
        <div className="mb-3 px-3.5 py-2 rounded-2xl bg-zinc-950/90 border border-amber-400/80 shadow-gold-glow backdrop-blur-md flex items-center gap-3 z-30 animate-fade-in">
          <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-amber-300">
            <Lock className="w-3.5 h-3.5 text-amber-400" /> Dados Guardados ({savedDiceIndices.length})
          </div>
          <div className="flex items-center gap-2">
            {savedDiceIndices.map((idx) => {
              const val = dice[idx];
              const canToggle = isMyTurn && hasRolledThisTurn && rollsLeft > 0 && !cantoFailed;

              return (
                <div
                  key={idx}
                  onClick={() => canToggle && onToggleKeep(idx)}
                  className="relative group cursor-pointer transform hover:scale-110 active:scale-95 transition-transform"
                  title="Toca para liberar este dado"
                >
                  <div className="w-8 h-8 rounded-xl p-1 bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 text-zinc-950 border-2 border-amber-400 shadow-2d-die-kept grid grid-cols-3 grid-rows-3 items-center justify-items-center">
                    {PIP_POSITIONS[val]?.map((posClass, pIdx) => (
                      <span key={pIdx} className={`w-1.5 h-1.5 rounded-full ${posClass} bg-amber-950 die-pip-sunken-kept`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2.5D Cacho Leather Cup Graphic (Interactive Mouse Drag & Shake + Mobile Shake) */}
      {(isRolling || isShakingMotion || !hasRolledThisTurn || rollsLeft > 0) && (
        <div
          onMouseDown={handleMouseDown}
          onClick={() => canRollNow && !isDraggingMouse && onTriggerRoll && onTriggerRoll()}
          className={`relative mb-3 z-20 transition-all ${
            canRollNow ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'
          }`}
          title={canRollNow ? 'Mantén presionado y mueve el ratón para agitar, o agita tu teléfono' : 'Cubilete Cacho'}
        >
          <div
            className={`w-32 h-36 sm:w-36 sm:h-40 rounded-b-[2.5rem] rounded-t-xl bg-gradient-to-b from-[#54250c] via-[#381606] to-[#1a0802] border-4 border-amber-900/90 shadow-2d-cup flex flex-col items-center justify-between transition-transform ${
              isRolling || isShakingMotion ? 'animate-cup-shake scale-110' : ''
            }`}
          >
            {/* Leather Stitched Upper Rim */}
            <div className="w-full h-4 sm:h-5 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 border-b-2 border-amber-950/80 rounded-t-lg shadow-inner flex items-center justify-center">
              <div className="w-4/5 h-0.5 border-t border-dashed border-amber-500/40" />
            </div>

            {/* Golden Casino Emblem */}
            <div className="my-auto text-center px-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shadow-gold-glow">
                <Dices className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 stroke-[2.5]" />
              </div>
              <span className="text-xl sm:text-2xl font-black font-cinzel text-gold-shine tracking-widest drop-shadow-lg block">
                CACHO
              </span>
            </div>

            {/* Leather Bottom Rim */}
            <div className="w-full h-3 sm:h-4 bg-zinc-950/90 rounded-b-[2rem] border-t border-amber-900/50 flex items-center justify-center">
              <div className="w-2/3 h-0.5 border-t border-dashed border-amber-700/30" />
            </div>
          </div>

          {/* Helper Badge for Drag & Shake */}
          {canRollNow && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-30">
              <span className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md text-amber-300 border border-amber-400/80 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 shadow-gold-glow animate-pulse">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>Arrastra / Agita el cubilete para lanzar</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Badges Overlay (Real vs Armada / Active Canto) */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-2.5 z-10">
        {hasRolledThisTurn && (
          <div>
            {isReal ? (
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black text-xs shadow-gold-glow flex items-center gap-1 border border-yellow-200 animate-bounce-short">
                <Sparkles className="w-3.5 h-3.5 fill-current text-zinc-950" /> ¡TIRO REAL! (5 Dados)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-zinc-900/90 text-zinc-300 font-semibold text-xs border border-zinc-700/80 shadow backdrop-blur-md">
                Jugada Armada
              </span>
            )}
          </div>
        )}

        {activeCanto && (
          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 border shadow-lg ${
                cantoFailed
                  ? 'bg-rose-950/90 text-rose-300 border-rose-600 shadow-rose-900/50'
                  : 'bg-amber-950/90 text-amber-300 border-amber-400 animate-pulse shadow-gold-glow'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Canto: {typeof activeCanto === 'string' ? activeCanto.toUpperCase() : `al ${activeCanto}`}
            </span>
          </div>
        )}
      </div>

      {/* Pure Active Rolling Physical Dice Tray (Dados Activos en el Tapete) */}
      <div className="w-full max-w-lg glass-panel-luxury rounded-3xl p-3.5 sm:p-5 border border-emerald-500/20 shadow-2xl z-10">
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-5 min-h-[64px]">
          {activeDiceIndices.map((idx) => {
            const val = dice[idx];
            const canToggle = isMyTurn && hasRolledThisTurn && rollsLeft > 0 && !cantoFailed;

            return (
              <div
                key={idx}
                onClick={() => canToggle && onToggleKeep(idx)}
                className={`relative group flex flex-col items-center transition-all transform ${
                  canToggle ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                }`}
                title="Haz clic para guardar este dado"
              >
                {/* 2.5D Bone / Ivory Die Cube */}
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center transition-all transform ${
                    isRolling ? 'animate-dice-roll' : ''
                  } bg-gradient-to-br from-amber-50 via-zinc-100 to-zinc-300 text-zinc-900 border-2 border-zinc-300 shadow-2d-die hover:border-amber-400/80`}
                >
                  {PIP_POSITIONS[val]?.map((posClass, pIdx) => (
                    <span
                      key={pIdx}
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 rounded-full posClass bg-zinc-900 die-pip-sunken"
                    />
                  ))}
                </div>

                {hasRolledThisTurn && (
                  <div className="mt-1 flex items-center justify-center">
                    <span className="px-2 py-0.5 rounded bg-zinc-900/80 text-zinc-400 text-[9px] sm:text-[10px] font-medium flex items-center gap-0.5 border border-zinc-800 group-hover:text-amber-300 group-hover:border-amber-500/50">
                      <Unlock className="w-2.5 h-2.5" /> Guardar
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
