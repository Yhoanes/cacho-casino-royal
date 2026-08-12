import React from 'react';
import { Crown, Check, Ban, Sparkles, Trophy } from 'lucide-react';
import VipAvatar from './VipAvatar';
import FloatingEmote from './FloatingEmote';

const GRID_LAYOUT = [
  // Row 1
  { key: 'balas', label: '1s (Balas)', col: 'izq' },
  { key: 'escalera', label: 'Escalera', col: 'centro' },
  { key: 'cuadras', label: '4s (Cuadras)', col: 'der' },
  // Row 2
  { key: 'tontos', label: '2s (Tontos)', col: 'izq' },
  { key: 'panza', label: 'Panza (Full)', col: 'centro' },
  { key: 'quinas', label: '5s (Quinas)', col: 'der' },
  // Row 3
  { key: 'trenes', label: '3s (Trenes)', col: 'izq' },
  { key: 'poker', label: 'Póker', col: 'centro' },
  { key: 'senas', label: '6s (Senas)', col: 'der' },
];

export default function MichiBoard({
  player,
  isCurrentTurnPlayer,
  turnState,
  scoringOptions,
  onScore,
  onCross,
  activeEmote,
}) {
  const { board = {}, boardDetails = {}, name, totalScore } = player;
  const { hasRolledThisTurn, cantoFailed } = turnState;

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
        className={`relative flex flex-col justify-between p-3 md:p-3.5 rounded-2xl border transition-all duration-300 ${
          isGrande ? 'min-h-[100px]' : 'min-h-[96px]'
        } ${
          isFilled
            ? isCrossed
              ? 'bg-zinc-950/80 border-rose-900/40 shadow-inner'
              : isReal
              ? 'bg-gradient-to-br from-amber-950/80 via-amber-900/40 to-zinc-950 border-amber-400/90 shadow-gold-glow scale-[1.01]'
              : 'bg-gradient-to-br from-emerald-950/80 via-zinc-950 to-zinc-900 border-emerald-500/60 shadow-lg'
            : canScoreThis
            ? 'bg-gradient-to-br from-amber-950/60 via-amber-900/20 to-zinc-950 border-amber-400 shadow-gold-glow animate-pulse-glow hover:scale-[1.03] cursor-pointer'
            : 'bg-zinc-950/60 border-zinc-800/80 shadow-michi-cell hover:border-zinc-700'
        }`}
      >
        {/* Cell Header */}
        <div className="flex items-center justify-between text-xs font-extrabold text-zinc-300">
          <span className="truncate">{label}</span>
          {isReal && !isCrossed && (
            <span className="text-amber-300 flex items-center gap-1 text-[10px] uppercase font-black tracking-wider bg-amber-500/25 px-1.5 py-0.5 rounded-md border border-amber-400/50 shadow-sm shrink-0">
              <Crown className="w-3 h-3 text-amber-300 fill-current" /> REAL
            </span>
          )}
        </div>

        {/* Cell Content / Value */}
        <div className="my-auto text-center py-1">
          {isFilled ? (
            isCrossed ? (
              <div className="flex items-center justify-center gap-1.5 text-rose-500 font-extrabold text-2xl md:text-3xl">
                <span>0</span>
                <span className="text-xs italic font-semibold text-rose-400/80">(Huevo)</span>
              </div>
            ) : (
              <span
                className={`text-2xl md:text-3xl font-black font-cinzel ${
                  isReal ? 'text-gold-shine drop-shadow-lg' : 'text-emerald-400 drop-shadow-md'
                }`}
              >
                {scoreVal}
              </span>
            )
          ) : (
            <div className="text-center">
              {canScoreThis ? (
                <div className="text-amber-300 font-black text-xl md:text-2xl drop-shadow">
                  +{option.score}
                  {option.isReal && <span className="text-xs text-amber-400 ml-1">★</span>}
                </div>
              ) : (
                <span className="text-zinc-600 text-xs font-semibold italic">Vacía</span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls for Turn Player */}
        {!isFilled && isCurrentTurnPlayer && hasRolledThisTurn && (
          <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-zinc-800/80">
            {canScoreThis && (
              <button
                type="button"
                onClick={() => onScore(catKey)}
                className="flex-1 py-1 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-xs flex items-center justify-center gap-1 transition-all shadow-gold-glow hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Anotar
              </button>
            )}
            {canCrossThis && (
              <button
                type="button"
                onClick={() => onCross(catKey)}
                className={`py-1 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  cantoFailed || !canScoreThis
                    ? 'flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg'
                    : 'bg-zinc-800/90 hover:bg-rose-950 hover:text-rose-300 text-zinc-400 border border-zinc-700'
                }`}
                title="Tachar con cero (Huevo)"
              >
                <Ban className="w-3.5 h-3.5" /> Tachar
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`w-full max-w-xl glass-panel-luxury rounded-3xl p-5 md:p-6 shadow-2d-table transition-all duration-300 relative ${
        isCurrentTurnPlayer ? 'border-2 border-amber-400/80 shadow-active-turn' : 'border border-zinc-800'
      }`}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between mb-4 pb-3.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <VipAvatar name={name} isTurn={isCurrentTurnPlayer} size="lg" />
            <FloatingEmote emote={activeEmote} />
          </div>
          <div>
            <h4 className="font-extrabold font-cinzel text-amber-400 text-lg md:text-xl leading-tight">
              MI TABLERO: {name}
            </h4>
            <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1 mt-0.5">
              {isCurrentTurnPlayer ? (
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> ¡Es tu turno!
                </span>
              ) : (
                <span className="text-zinc-500">Esperando turno...</span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right bg-zinc-900/80 px-3.5 py-1.5 rounded-2xl border border-zinc-800 shadow-inner">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest block">
            Total Puntos
          </span>
          <div className="text-2xl md:text-3xl font-black text-gold-shine font-cinzel">
            {totalScore || 0}
          </div>
        </div>
      </div>

      {/* 3x3 Michi Grid */}
      <div className="grid grid-cols-3 gap-3 md:gap-3.5 mb-3.5">
        {GRID_LAYOUT.map((cell) => renderCell(cell.key, cell.label, false))}
      </div>

      {/* Bottom Row: La Grande */}
      <div className="mt-3.5">
        {renderCell('grande', 'LA GRANDE (50 Puntos)', true)}
      </div>
    </div>
  );
}
