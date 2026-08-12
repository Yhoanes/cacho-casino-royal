import React from 'react';
import { Crown, Check, Ban } from 'lucide-react';
import VipAvatar from './VipAvatar';
import FloatingEmote from './FloatingEmote';

const GRID_LAYOUT = [
  // Row 1
  { key: 'balas', label: '1s (Balas)' },
  { key: 'escalera', label: 'Escalera' },
  { key: 'cuadras', label: '4s (Cuadras)' },
  // Row 2
  { key: 'tontos', label: '2s (Tontos)' },
  { key: 'panza', label: 'Panza (Full)' },
  { key: 'quinas', label: '5s (Quinas)' },
  // Row 3
  { key: 'trenes', label: '3s (Trenes)' },
  { key: 'poker', label: 'Póker' },
  { key: 'senas', label: '6s (Senas)' },
];

export default function MichiBoard({
  player,
  isCurrentTurnPlayer,
  turnState,
  scoringOptions,
  onScore,
  onCross,
  activeEmote,
  hideHeader = false,
}) {
  const { board = {}, boardDetails = {}, name, totalScore } = player || {};
  const { hasRolledThisTurn, cantoFailed } = turnState || {};

  const renderCell = (catKey, label, isGrande = false) => {
    const scoreVal = board[catKey];
    const details = boardDetails[catKey] || {};
    const option = scoringOptions?.[catKey];

    const isFilled = scoreVal !== null && scoreVal !== undefined;
    const isCrossed = details.isCrossed || scoreVal === 0;
    const isReal = details.isReal;

    const canScoreThis = isCurrentTurnPlayer && hasRolledThisTurn && !isFilled && option?.canScore && !cantoFailed;
    const canCrossThis = isCurrentTurnPlayer && hasRolledThisTurn && !isFilled;

    return (
      <div
        key={catKey}
        className={`relative flex flex-col justify-between p-1.5 sm:p-2 rounded-xl border transition-all duration-200 ${
          isGrande ? 'min-h-[46px] sm:min-h-[56px] md:min-h-[64px]' : 'min-h-[42px] sm:min-h-[50px] md:min-h-[56px]'
        } ${
          isFilled
            ? isCrossed
              ? 'bg-zinc-950/90 border-rose-950 text-rose-500 shadow-inner'
              : isReal
              ? 'bg-gradient-to-br from-amber-950/80 via-amber-900/40 to-zinc-950 border-amber-400/90 shadow-gold-glow scale-[1.01]'
              : 'bg-gradient-to-br from-emerald-950/80 via-zinc-950 to-zinc-900 border-emerald-500/60 shadow-md text-emerald-300'
            : canScoreThis
            ? 'bg-gradient-to-br from-amber-950/70 via-amber-900/30 to-zinc-950 border-amber-400 text-amber-300 shadow-gold-glow animate-pulse cursor-pointer'
            : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
        }`}
      >
        {/* Cell Header */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs font-extrabold text-zinc-300 leading-none">
          <span className="truncate">{label}</span>
          {isReal && !isCrossed && (
            <span className="text-amber-300 text-[9px] sm:text-[10px] font-black uppercase shrink-0 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-400/40">
              REAL ★
            </span>
          )}
        </div>

        {/* Cell Value */}
        <div className="my-auto text-center py-0.5">
          {isFilled ? (
            isCrossed ? (
              <span className="text-rose-500 font-bold text-sm sm:text-base font-mono">0 (Huevo)</span>
            ) : (
              <span
                className={`text-sm sm:text-lg md:text-xl font-black font-cinzel ${
                  isReal ? 'text-gold-shine drop-shadow' : 'text-emerald-400'
                }`}
              >
                {scoreVal}
              </span>
            )
          ) : (
            <div className="text-center">
              {canScoreThis ? (
                <span className="text-amber-300 font-black text-sm sm:text-base md:text-lg">
                  +{option.score}
                </span>
              ) : (
                <span className="text-zinc-600 text-[10px] font-normal italic">-</span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls for Turn Player */}
        {!isFilled && isCurrentTurnPlayer && hasRolledThisTurn && (
          <div className="flex items-center gap-1 mt-0.5 pt-1 border-t border-zinc-800/80">
            {canScoreThis && (
              <button
                type="button"
                onClick={() => onScore(catKey)}
                className="flex-1 py-1 px-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-black text-[9px] sm:text-xs flex items-center justify-center gap-0.5 cursor-pointer shadow-gold-glow"
              >
                <Check className="w-3 h-3 stroke-[3]" /> Anotar
              </button>
            )}
            {canCrossThis && (
              <button
                type="button"
                onClick={() => onCross(catKey)}
                className={`py-1 px-1 rounded-lg font-bold text-[9px] sm:text-xs flex items-center justify-center gap-0.5 cursor-pointer ${
                  cantoFailed || !canScoreThis
                    ? 'flex-1 bg-rose-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-rose-300 border border-zinc-700'
                }`}
                title="Tachar con cero (Huevo)"
              >
                <Ban className="w-3 h-3" /> Tachar
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`w-full glass-panel-luxury rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-4 shadow-2d-table transition-all relative shrink-0 ${
        isCurrentTurnPlayer ? 'border-2 border-amber-400/90 shadow-active-turn' : 'border border-zinc-800'
      }`}
    >
      {/* Player Header (Optional) */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="relative">
              <VipAvatar name={name} isTurn={isCurrentTurnPlayer} size="sm" />
              <FloatingEmote emote={activeEmote} />
            </div>
            <div>
              <h4 className="font-extrabold font-cinzel text-amber-400 text-xs sm:text-sm leading-none">
                MI TABLERO: {name}
              </h4>
            </div>
          </div>
          <div className="text-right bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block leading-none">
              Total: <strong className="text-amber-300 font-cinzel text-sm sm:text-base">{totalScore || 0}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 3x3 Michi Grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        {GRID_LAYOUT.map((cell) => renderCell(cell.key, cell.label, false))}
      </div>

      {/* Bottom Row: La Grande */}
      <div>
        {renderCell('grande', 'LA GRANDE (50 Puntos)', true)}
      </div>
    </div>
  );
}
