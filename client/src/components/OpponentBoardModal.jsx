import React from 'react';
import { X, Eye, Trophy } from 'lucide-react';
import MichiBoard from './MichiBoard';
import VipAvatar from './VipAvatar';

export default function OpponentBoardModal({
  isOpen,
  onClose,
  opponent,
}) {
  if (!isOpen || !opponent) return null;

  const { name, totalScore, wins = 0 } = opponent;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md glass-panel-gold rounded-3xl p-5 shadow-gold-glow border-2 border-amber-400/80 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3">
          <div className="flex items-center gap-3">
            <VipAvatar name={name} size="md" />
            <div>
              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">
                <Eye className="w-3.5 h-3.5 text-amber-400" /> Espiando Tablero Rival
              </div>
              <h3 className="font-black font-cinzel text-white text-lg leading-tight">
                {name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-black text-amber-300 font-cinzel text-xs bg-zinc-950 px-2.5 py-1 rounded-xl border border-amber-500/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400 fill-current" /> {wins}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Michi Board View */}
        <div className="flex-1 overflow-y-auto pr-1 flex items-center justify-center">
          <MichiBoard
            player={opponent}
            isCurrentTurnPlayer={false}
            turnState={{}}
            scoringOptions={{}}
            onScore={() => {}}
            onCross={() => {}}
            activeEmote={null}
            hideHeader={false}
          />
        </div>
      </div>
    </div>
  );
}
