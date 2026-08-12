import React from 'react';
import { Lock, Unlock, Sparkles, Target, Dices } from 'lucide-react';

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
}) {
  const {
    dice = [1, 1, 1, 1, 1],
    keptDice = [false, false, false, false, false],
    isReal,
    rollsLeft,
    hasRolledThisTurn,
    cantoFailed,
  } = turnState;

  return (
    <div className="flex flex-col items-center justify-center p-2 relative">
      {/* 2.5D Cacho Leather Cup Graphic (Rendered ONLY while isRolling) */}
      {isRolling && (
        <div className="relative mb-4 z-20 animate-fade-in">
          <div className="w-32 h-36 rounded-b-[2.5rem] rounded-t-xl bg-gradient-to-b from-[#54250c] via-[#381606] to-[#1a0802] border-4 border-amber-900/90 shadow-2d-cup flex flex-col items-center justify-between animate-cup-shake scale-110">
            {/* Leather Stitched Upper Rim */}
            <div className="w-full h-4 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 border-b-2 border-amber-950/80 rounded-t-lg shadow-inner flex items-center justify-center">
              <div className="w-4/5 h-0.5 border-t border-dashed border-amber-500/40" />
            </div>

            {/* Golden Casino Emblem */}
            <div className="my-auto text-center px-2">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shadow-gold-glow">
                <Dices className="w-5 h-5 text-amber-400 stroke-[2.5]" />
              </div>
              <span className="text-xl font-black font-cinzel text-gold-shine tracking-widest drop-shadow-lg block">
                CACHO
              </span>
            </div>

            {/* Leather Bottom Rim */}
            <div className="w-full h-3 bg-zinc-950/90 rounded-b-[2rem] border-t border-amber-900/50 flex items-center justify-center">
              <div className="w-2/3 h-0.5 border-t border-dashed border-amber-700/30" />
            </div>
          </div>
        </div>
      )}

      {/* Badges Overlay */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-3 z-10">
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

      {/* 2.5D Hiperrealista Dice Tray (Always Clean & Visible on Felt Table) */}
      <div className="w-full max-w-lg glass-panel-luxury rounded-3xl p-4 sm:p-5 border border-emerald-500/20 shadow-2xl z-10">
        <div className="text-center mb-3">
          <p className="text-[11px] uppercase tracking-widest text-emerald-400/90 font-bold font-mono">
            {isMyTurn
              ? hasRolledThisTurn
                ? rollsLeft > 0
                  ? '👇 Toca los dados para GUARDAR / LIBERAR'
                  : '⚠️ Sin tiros. Anota o tacha casilla'
                : '🎲 Presiona Lanzar para iniciar turno'
              : '⏳ Esperando la jugada del oponente...'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
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
              >
                {/* 2.5D Bone / Ivory Die Cube */}
                <div
                  className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl p-1.5 grid grid-cols-3 grid-rows-3 items-center justify-items-center transition-all transform ${
                    isRolling && !isKept ? 'animate-dice-roll' : ''
                  } ${
                    isKept
                      ? 'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 text-zinc-950 border-3 border-amber-400 shadow-2d-die-kept scale-105'
                      : 'bg-gradient-to-br from-amber-50 via-zinc-100 to-zinc-300 text-zinc-900 border-2 border-zinc-300 shadow-2d-die hover:border-amber-400/60'
                  }`}
                >
                  {PIP_POSITIONS[val]?.map((posClass, pIdx) => (
                    <span
                      key={pIdx}
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full ${posClass} ${
                        isKept
                          ? 'bg-amber-950 die-pip-sunken-kept'
                          : 'bg-zinc-900 die-pip-sunken'
                      }`}
                    />
                  ))}
                </div>

                {/* Keep Lock Indicator */}
                {hasRolledThisTurn && (
                  <div className="mt-1.5 flex items-center justify-center">
                    {isKept ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/50 text-[9px] font-black flex items-center gap-0.5 shadow-sm">
                        <Lock className="w-2.5 h-2.5 text-amber-400" /> Guardado
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900/80 text-zinc-400 text-[9px] font-medium flex items-center gap-0.5 border border-zinc-800">
                        <Unlock className="w-2.5 h-2.5" /> Libre
                      </span>
                    )}
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
