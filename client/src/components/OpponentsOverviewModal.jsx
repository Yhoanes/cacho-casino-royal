import React from 'react';
import { X, BarChart3, Users, Crown, Trophy } from 'lucide-react';
import MichiBoard from './MichiBoard';
import VipAvatar from './VipAvatar';

export default function OpponentsOverviewModal({
  isOpen,
  onClose,
  opponents = [],
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex flex-col items-center animate-fade-in select-none">
      {/* Modal Container */}
      <div className="w-full max-w-3xl glass-panel-gold rounded-3xl p-4 sm:p-6 shadow-gold-glow border-2 border-amber-400/80 my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40">
              <BarChart3 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black font-cinzel text-amber-400 text-lg sm:text-xl">
                Tableros de Rivales
              </h3>
              <p className="text-[11px] text-zinc-400">
                Inspecciona los puntos y estrategias de todos los oponentes ({opponents.length})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Opponents Michi Boards Grid */}
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {opponents.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 font-semibold text-sm">
              No hay oponentes en esta sala aún.
            </div>
          ) : (
            opponents.map((op) => (
              <div
                key={op.userId || op.socketId}
                className="bg-zinc-950/80 rounded-2xl p-3 sm:p-4 border border-zinc-800/80 shadow-lg flex flex-col gap-3"
              >
                {/* Opponent Info Header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <VipAvatar name={op.name} size="sm" />
                    <div>
                      <h4 className="font-extrabold text-white text-base flex items-center gap-1.5">
                        {op.name}
                        {op.wins > 0 && (
                          <span className="text-[10px] text-amber-300 bg-amber-950 px-2 py-0.5 rounded-md border border-amber-500/40 font-cinzel flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-amber-400 fill-current" /> {op.wins} Vic.
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>

                  <div className="text-right bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-800">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block leading-none">
                      Total Puntos
                    </span>
                    <div className="text-base sm:text-lg font-black text-emerald-400 font-cinzel mt-0.5">
                      {op.totalScore || 0} pts
                    </div>
                  </div>
                </div>

                {/* Opponent Michi Board */}
                <div className="w-full flex justify-center">
                  <MichiBoard
                    player={op}
                    isCurrentTurnPlayer={false}
                    turnState={{}}
                    scoringOptions={{}}
                    onScore={() => {}}
                    onCross={() => {}}
                    activeEmote={null}
                    hideHeader={true}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
