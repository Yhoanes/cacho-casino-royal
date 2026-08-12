import React from 'react';
import { Target, CheckCircle2, XCircle, Calculator } from 'lucide-react';

export default function HudAnnouncement({ cantoResolution, isVisible }) {
  if (!cantoResolution?.active || !isVisible) return null;

  const {
    success,
    calledNumber,
    predictedSum,
    sumUnkept,
    playerName,
    score,
    targetCategory,
    isTuti,
  } = cantoResolution;

  const displayTarget = predictedSum
    ? `Suma ${predictedSum} (a ${targetCategory?.toUpperCase()})`
    : typeof calledNumber === 'string'
    ? calledNumber.toUpperCase()
    : calledNumber;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-slide-down w-auto max-w-[92vw]">
      <div
        className={`flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border shadow-2xl backdrop-blur-md transition-all ${
          success
            ? 'bg-zinc-950/95 border-amber-400/90 text-amber-300 shadow-gold-glow'
            : 'bg-zinc-950/95 border-rose-600/90 text-rose-300 shadow-2xl'
        }`}
      >
        {/* Player & Called Target */}
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm whitespace-nowrap">
          <Calculator className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-zinc-100 font-extrabold">{playerName}</span>
          <span className="text-zinc-400 font-normal">cantó</span>
          <span className="text-amber-400 font-black text-xs sm:text-sm font-mono bg-zinc-900 px-2 py-0.5 rounded-md border border-amber-500/30">
            {displayTarget}
          </span>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-zinc-700 shrink-0" />

        {/* Result Badge */}
        <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm whitespace-nowrap">
          {success ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-cinzel tracking-wider">
                {isTuti ? '¡TUTI!' : '¡ACERTÓ!'}
              </span>
              <span className="text-amber-300 text-[11px] font-mono bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                +{score || 50} pts
              </span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-rose-400 font-cinzel tracking-wider">
                FALLÓ {sumUnkept !== undefined ? `(Suma: ${sumUnkept})` : ''}
              </span>
              <span className="text-rose-300 text-[11px] font-mono bg-rose-950 px-2 py-0.5 rounded-full border border-rose-800">
                (Tacha 0)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
