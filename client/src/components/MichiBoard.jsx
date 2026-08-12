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
        className={`relative flex flex-col justify-between p-1 rounded-lg border transition-all duration-150 ${
          isGrande ? 'min-h-[36px] sm:min-h-[44px]' : 'min-h-[34px] sm:min-h-[40px]'
        } ${
          isFilled
            ? isCrossed
              ? 'bg-zinc-950/90 border-rose-950 text-rose-500 shadow-inner'
              : isReal
              ? 'bg-gradient-to-br from-amber-950/80 via-amber-900/40 to-zinc-950 border-amber-400/90 shadow-sm'
              : 'bg-zinc-900 border-emerald-700/60 text-emerald-300'
            : canScoreThis
            ? 'bg-amber-950/70 border-amber-400 text-amber-300 animate-pulse cursor-pointer'
            : 'bg-zinc-950/60 border-zinc-850'
        }`}
      >
        {/* Cell Header */}
        <div className="flex items-center justify-between text-[9px] font-extrabold text-zinc-300 leading-none">
          <span className="truncate">{label}</span>
          {isReal && !isCrossed && (
            <span className="text-amber-300 text-[8px] font-black uppercase shrink-0">
              ★
            </span>
          )}
        </div>

        {/* Cell Value */}
        <div className="my-auto text-center py-0">
          {isFilled ? (
            isCrossed ? (
              <span className="text-rose-500 font-bold text-xs sm:text-sm font-mono">0</span>
            ) : (
              <span
                className={`text-xs sm:text-sm font-black font-cinzel ${
                  isReal ? 'text-gold-shine' : 'text-emerald-400'
                }`}
              >
                {scoreVal}
              </span>
            )
          ) : (
            <div className="text-center">
              {canScoreThis ? (
                <span className="text-amber-300 font-black text-xs sm:text-sm">
                  +{option.score}
                </span>
              ) : (
                <span className="text-zinc-700 text-[8px] font-normal">-</span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls for Turn Player */}
        {!isFilled && isCurrentTurnPlayer && hasRolledThisTurn && (
          <div className="flex items-center gap-0.5 mt-0.5 pt-0.5 border-t border-zinc-800/80">
            {canScoreThis && (
              <button
                type="button"
                onClick={() => onScore(catKey)}
                className="flex-1 py-0.5 px-0.5 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-black text-[8px] flex items-center justify-center gap-0.5 cursor-pointer shadow"
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" /> OK
              </button>
            )}
            {canCrossThis && (
              <button
                type="button"
                onClick={() => onCross(catKey)}
                className={`py-0.5 px-0.5 rounded font-bold text-[8px] flex items-center justify-center gap-0.5 cursor-pointer ${
                  cantoFailed || !canScoreThis
                    ? 'flex-1 bg-rose-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-rose-300'
                }`}
                title="Tachar con cero (Huevo)"
              >
                <Ban className="w-2.5 h-2.5" /> 0
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`w-full max-w-sm mx-auto glass-panel-luxury rounded-2xl p-1.5 sm:p-2 shadow-2d-table transition-all relative shrink-0 max-h-[30vh] overflow-hidden flex flex-col justify-between ${
        isCurrentTurnPlayer ? 'border-2 border-amber-400/90 shadow-active-turn' : 'border border-zinc-800'
      }`}
    >
      {/* Player Header (Optional) */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-1 pb-1 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <VipAvatar name={name} isTurn={isCurrentTurnPlayer} size="xs" />
              <FloatingEmote emote={activeEmote} />
            </div>
            <div>
              <h4 className="font-extrabold font-cinzel text-amber-400 text-xs leading-none">
                MI TABLERO: {name}
              </h4>
            </div>
          </div>
          <div className="text-right bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
            <span className="text-[8px] uppercase font-bold text-zinc-400 tracking-wider block leading-none">
              Total: <strong className="text-amber-300 font-cinzel text-xs">{totalScore || 0}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 3x3 Michi Grid */}
      <div className="grid grid-cols-3 gap-1 mb-1">
        {GRID_LAYOUT.map((cell) => renderCell(cell.key, cell.label, false))}
      </div>

      {/* Bottom Row: La Grande */}
      <div>
        {renderCell('grande', 'LA GRANDE (50 Puntos)', true)}
      </div>
    </div>
  );
}
