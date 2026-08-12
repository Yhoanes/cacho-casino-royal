import React, { useEffect, useState, useRef } from 'react';
import { Lock, Unlock, Sparkles, Target, Dices, Smartphone, Move, Hand } from 'lucide-react';

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
  const [isDragging, setIsDragging] = useState(false);
  const [cupPos, setCupPos] = useState({ x: 0, y: 0 });

  const cupRef = useRef(null);
  const lastPosRef = useRef({ x: 0, y: 0, time: Date.now() });

  const canRollNow = isMyTurn && rollsLeft > 0 && !cantoFailed && !isRolling && !cantoResolution?.active;

  // Mobile Device Motion API (Shake to Roll - High Sensitivity + iOS Perms)
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
          const deltaX = Math.abs(x - lastX);
          const deltaY = Math.abs(y - lastY);
          const deltaZ = Math.abs(z - lastZ);
          const speed = ((deltaX + deltaY + deltaZ) / diffTime) * 1000;

          // Sensitive threshold for mobile devices (speed > 10)
          if (speed > 10) {
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

    // Request Motion Permissions on iOS if available
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then((response) => {
          if (response === 'granted') {
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
  }, [canRollNow, onTriggerRoll]);

  // Wide Free Screen Drag & Shake Handlers (Mouse & Touch)
  const handleStartDrag = (clientX, clientY) => {
    if (!canRollNow) return;
    setIsDragging(true);
    lastPosRef.current = { x: clientX, y: clientY, time: Date.now() };
  };

  const handleMoveDrag = (clientX, clientY) => {
    if (!isDragging || !canRollNow) return;
    const now = Date.now();
    const dt = now - lastPosRef.current.time;

    if (dt > 30) {
      const dx = clientX - lastPosRef.current.x;
      const dy = clientY - lastPosRef.current.y;
      const speed = (Math.abs(dx) + Math.abs(dy)) / dt;

      // Update cup position offset
      setCupPos((prev) => ({
        x: Math.max(-150, Math.min(150, prev.x + dx * 0.8)),
        y: Math.max(-120, Math.min(120, prev.y + dy * 0.8)),
      }));

      if (speed > 0.4) {
        setIsShakingMotion(true);
        if (navigator.vibrate) navigator.vibrate([25, 15, 25]);
      } else {
        setIsShakingMotion(false);
      }

      lastPosRef.current = { x: clientX, y: clientY, time: now };
    }
  };

  const handleEndDrag = () => {
    if (isDragging && canRollNow) {
      setIsDragging(false);
      setIsShakingMotion(false);
      setCupPos({ x: 0, y: 0 });
      if (onTriggerRoll) onTriggerRoll();
    }
  };

  // Kept (Saved) vs Free (Active) dice
  const savedDiceIndices = dice.map((_, idx) => idx).filter((idx) => keptDice[idx]);
  const freeDiceIndices = dice.map((_, idx) => idx).filter((idx) => !keptDice[idx]);

  return (
    <div
      onMouseMove={(e) => handleMoveDrag(e.clientX, e.clientY)}
      onMouseUp={handleEndDrag}
      onTouchMove={(e) => {
        if (e.touches[0]) handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchEnd={handleEndDrag}
      className="flex flex-col items-center justify-center p-1 relative select-none w-full min-h-[300px]"
    >
      {/* Badges Overlay (Real vs Armada / Active Canto) */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-3 z-10">
        {hasRolledThisTurn && (
          <div>
            {isReal ? (
              <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black text-xs shadow-gold-glow flex items-center gap-1 border border-yellow-200 animate-bounce-short">
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
              className={`px-3.5 py-1 rounded-full text-xs font-black flex items-center gap-1 border shadow-lg ${
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

      {/* 2.5D Cacho Leather Cup (Rendered when rolling, shaking, or before initial roll) */}
      {(isRolling || isShakingMotion || !hasRolledThisTurn || rollsLeft > 0) && (
        <div
          ref={cupRef}
          onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            if (e.touches[0]) handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onClick={() => canRollNow && !isDragging && onTriggerRoll && onTriggerRoll()}
          style={{
            transform: `translate3d(${cupPos.x}px, ${cupPos.y}px, 0px)`,
          }}
          className={`relative mb-4 z-30 transition-transform duration-75 ${
            canRollNow ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'
          }`}
          title={canRollNow ? 'Mantén presionado y mueve por la pantalla para agitar el vaso, o agita tu móvil' : 'Cubilete Cacho'}
        >
          <div
            className={`w-36 h-40 sm:w-40 sm:h-44 rounded-b-[2.5rem] rounded-t-xl bg-gradient-to-b from-[#54250c] via-[#381606] to-[#1a0802] border-4 border-amber-900/90 shadow-2d-cup flex flex-col items-center justify-between transition-transform ${
              isRolling || isShakingMotion ? 'animate-cup-shake scale-110' : ''
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

          {/* Dynamic Gesture Visual Prompt */}
          {canRollNow && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap z-40">
              <span className="px-3.5 py-1.5 rounded-full bg-black/90 backdrop-blur-md text-amber-300 border border-amber-400/90 text-xs font-black flex items-center gap-1.5 shadow-gold-glow animate-pulse">
                <Hand className="w-4 h-4 text-amber-400" />
                <span>👋 Arrastra el vaso por la mesa o agita tu móvil</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Physical Dice Tray (ONLY VISIBLE AFTER THE CUP HAS ROLLED!) */}
      {hasRolledThisTurn ? (
        <div className="w-full max-w-lg glass-panel-luxury rounded-3xl p-4 sm:p-6 border border-emerald-500/20 shadow-2xl z-10 animate-fade-in">
          <div className="text-center mb-3">
            <p className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold font-mono">
              {isMyTurn
                ? rollsLeft > 0
                  ? '👇 Toca los dados que quieres GUARDAR en la mesa'
                  : '⚠️ Sin tiros restantes. Selecciona casilla para anotar o tachar en Mi Tablero'
                : '⏳ Esperando la jugada del oponente...'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3.5 sm:gap-5">
            {dice.map((val, idx) => {
              const isKept = keptDice[idx];
              const canToggle = isMyTurn && hasRolledThisTurn && rollsLeft > 0 && !cantoFailed;

              return (
                <div
                  key={idx}
                  onClick={() => canToggle && onToggleKeep(idx)}
                  className={`relative group flex flex-col items-center transition-all transform ${
                    canToggle ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                  }`}
                  title={isKept ? 'Dado Guardado en la mesa (se queda)' : 'Toca para GUARDAR este dado'}
                >
                  {/* 2.5D Bone / Ivory Die Cube */}
                  <div
                    className={`w-13 h-13 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center transition-all transform ${
                      isRolling && !isKept ? 'animate-dice-roll' : ''
                    } ${
                      isKept
                        ? 'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 text-zinc-950 border-3 border-amber-400 shadow-2d-die-kept scale-105 ring-4 ring-amber-400/50'
                        : 'bg-gradient-to-br from-amber-50 via-zinc-100 to-zinc-300 text-zinc-900 border-2 border-zinc-300 shadow-2d-die hover:border-amber-400/80'
                    }`}
                  >
                    {PIP_POSITIONS[val]?.map((posClass, pIdx) => (
                      <span
                        key={pIdx}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 rounded-full ${posClass} ${
                          isKept ? 'bg-amber-950 die-pip-sunken-kept' : 'bg-zinc-900 die-pip-sunken'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Lock Status Badge */}
                  <div className="mt-1.5 flex items-center justify-center">
                    {isKept ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-300 border border-amber-400/60 text-[10px] font-black flex items-center gap-1 shadow-sm">
                        <Lock className="w-2.5 h-2.5 text-amber-400" /> Guardado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 text-zinc-400 text-[10px] font-medium flex items-center gap-1 border border-zinc-800 group-hover:text-amber-300 group-hover:border-amber-500/50">
                        <Unlock className="w-2.5 h-2.5" /> Libre
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Prompt before initial roll */
        <div className="text-center mt-2 z-10">
          <p className="text-sm font-black font-cinzel text-gold-shine tracking-wider bg-black/80 px-4 py-2 rounded-full border border-amber-400/60 shadow-gold-glow">
            🎲 Los dados están dentro del Cacho. ¡Agita o arrastra para tirar!
          </p>
        </div>
      )}
    </div>
  );
}
