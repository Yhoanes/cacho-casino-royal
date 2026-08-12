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
        className={`relative flex flex-col justify-between p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all duration-200 ${
          isGrande ? 'min-h-[64px] sm:min-h-[85px]' : 'min-h-[60px] sm:min-h-[78px]'
        } ${
          isFilled
            ? isCrossed
              ? 'bg-zinc-950/80 border-rose-900/40 shadow-inner'
              : isReal
              ? 'bg-gradient-to-br from-amber-950/80 via-amber-900/40 to-zinc-950 border-amber-400/90 shadow-gold-glow scale-[1.01]'
              : 'bg-gradient-to-br from-emerald-950/80 via-zinc-950 to-zinc-900 border-emerald-500/60 shadow-lg'
            : canScoreThis
            ? 'bg-gradient-to-br from-amber-950/60 via-amber-900/20 to-zinc-950 border-amber-400 shadow-gold-glow animate-pulse-glow hover:scale-[1.02] cursor-pointer'
            : 'bg-zinc-950/60 border-zinc-800/80 shadow-michi-cell'
        }`}
      >
        {/* Cell Header */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs font-extrabold text-zinc-300 leading-none">
          <span className="truncate">{label}</span>
          {isReal && !isCrossed && (
            <span className="text-amber-300 flex items-center gap-0.5 text-[8px] sm:text-[10px] uppercase font-black bg-amber-500/25 px-1 py-0.5 rounded border border-amber-400/50 shrink-0">
              <Crown className="w-2.5 h-2.5 text-amber-300 fill-current" /> REAL
            </span>
          )}
        </div>

        {/* Cell Content / Value */}
        <div className="my-auto text-center py-0.5">
          {isFilled ? (
            isCrossed ? (
              <div className="flex items-center justify-center gap-1 text-rose-500 font-extrabold text-lg sm:text-2xl">
                <span>0</span>
                <span className="text-[9px] italic font-semibold text-rose-400/80">(Huevo)</span>
              </div>
            ) : (
              <span
                className={`text-lg sm:text-2xl font-black font-cinzel ${
                  isReal ? 'text-gold-shine drop-shadow' : 'text-emerald-400'
                }`}
              >
                {scoreVal}
              </span>
            )
          ) : (
            <div className="text-center">
              {canScoreThis ? (
                <div className="text-amber-300 font-black text-base sm:text-xl drop-shadow">
                  +{option.score}
                  {option.isReal && <span className="text-xs text-amber-400 ml-0.5">★</span>}
                </div>
              ) : (
                <span className="text-zinc-600 text-[10px] font-semibold italic">Vacía</span>
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
                className="flex-1 py-0.5 px-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-black text-[9px] sm:text-xs flex items-center justify-center gap-0.5 shadow-gold-glow cursor-pointer"
              >
                <Check className="w-3 h-3 stroke-[3]" /> Anotar
              </button>
            )}
            {canCrossThis && (
              <button
                type="button"
                onClick={() => onCross(catKey)}
                className={`py-0.5 px-1 rounded-lg font-bold text-[9px] sm:text-xs flex items-center justify-center gap-0.5 cursor-pointer ${
                  cantoFailed || !canScoreThis
                    ? 'flex-1 bg-gradient-to-r from-rose-600 to-rose-500 text-white'
                    : 'bg-zinc-800/90 text-zinc-400 border border-zinc-700 hover:text-rose-300'
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
      className={`w-full max-w-lg glass-panel-luxury rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-2d-table transition-all relative ${
        isCurrentTurnPlayer ? 'border-2 border-amber-400/90 shadow-active-turn animate-active-turn-pulse' : 'border border-zinc-800'
      }`}
    >
      {/* Player Header (Optional) */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="relative">
              <VipAvatar name={name} isTurn={isCurrentTurnPlayer} size="md" />
              <FloatingEmote emote={activeEmote} />
            </div>
            <div>
              <h4 className="font-extrabold font-cinzel text-amber-400 text-sm sm:text-base leading-tight">
                MI TABLERO: {name}
              </h4>
              <p className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                {isCurrentTurnPlayer ? (
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> ¡Es tu turno!
                  </span>
                ) : (
                  <span className="text-zinc-500">Esperando turno...</span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block leading-none">
              Total
            </span>
            <div className="text-lg sm:text-xl font-black text-gold-shine font-cinzel leading-none mt-0.5">
              {totalScore || 0}
            </div>
          </div>
        </div>
      )}

      {/* 3x3 Michi Grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 mb-1.5 sm:mb-2.5">
        {GRID_LAYOUT.map((cell) => renderCell(cell.key, cell.label, false))}
      </div>

      {/* Bottom Row: La Grande */}
      <div>
        {renderCell('grande', 'LA GRANDE (50 Puntos)', true)}
      </div>
    </div>
  );
}
