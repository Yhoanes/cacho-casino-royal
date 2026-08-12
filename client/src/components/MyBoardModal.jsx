import React from 'react';
import { X, CheckCircle2, Crown, Sparkles } from 'lucide-react';
import MichiBoard from './MichiBoard';
import VipAvatar from './VipAvatar';

export default function MyBoardModal({
  isOpen,
  onClose,
  player,
  isCurrentTurnPlayer,
  turnState,
  scoringOptions,
  onScore,
  onCross,
}) {
  if (!isOpen || !player) return null;

  const { name, totalScore = 0 } = player;

  const handleScoreAndClose = (catKey) => {
    onScore(catKey);
    onClose();
  };

  const handleCrossAndClose = (catKey) => {
    onCross(catKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md p-3 sm:p-5 flex flex-col items-center justify-center animate-fade-in select-none">
      {/* Modal Card */}
      <div className="w-full max-w-md glass-panel-gold rounded-3xl p-4 sm:p-5 shadow-gold-glow border-2 border-amber-400/90 flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3">
          <div className="flex items-center gap-2.5">
            <VipAvatar name={name} isTurn={isCurrentTurnPlayer} size="sm" />
            <div>
              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mi Tablero Michi
              </div>
              <h3 className="font-black font-cinzel text-white text-base sm:text-lg leading-tight">
                {name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-zinc-950 px-3 py-1 rounded-xl border border-amber-500/40 text-right">
              <span className="text-[8px] uppercase font-bold text-zinc-400 block leading-none">
                Total
              </span>
              <span className="text-sm sm:text-base font-black text-gold-shine font-cinzel leading-none mt-0.5 block">
                {totalScore} pts
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Michi Board Grid View */}
        <div className="flex-1 overflow-y-auto pr-1">
          <MichiBoard
            player={player}
            isCurrentTurnPlayer={isCurrentTurnPlayer}
            turnState={turnState}
            scoringOptions={scoringOptions}
            onScore={handleScoreAndClose}
            onCross={handleCrossAndClose}
            activeEmote={null}
            hideHeader={true}
          />
        </div>

        {/* Close / Confirm Button */}
        <div className="mt-3 pt-2 border-t border-zinc-800/80 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-gold-glow hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            Volver a la Mesa
          </button>
        </div>
      </div>
    </div>
  );
}
