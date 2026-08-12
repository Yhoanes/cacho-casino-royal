import React, { useState } from 'react';
import { Crown, Trophy, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import VipAvatar from './VipAvatar';
import FloatingEmote from './FloatingEmote';

const MINI_GRID_CELLS = [
  { key: 'balas', label: '1s' },
  { key: 'escalera', label: 'Esc' },
  { key: 'cuadras', label: '4s' },
  { key: 'tontos', label: '2s' },
  { key: 'panza', label: 'Pan' },
  { key: 'quinas', label: '5s' },
  { key: 'trenes', label: '3s' },
  { key: 'poker', label: 'Pok' },
  { key: 'senas', label: '6s' },
];

export default function OpponentBoards({ players = [], currentTurnIndex, currentSocketId, currentUserId, activeEmotes = {} }) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const opponents = players.filter((p) => p.userId ? p.userId !== currentUserId : p.socketId !== currentSocketId);

  if (opponents.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mt-5 md:mt-7 glass-panel-luxury rounded-3xl p-4 md:p-5 shadow-2xl border border-amber-500/20">
      <div
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="flex items-center justify-between cursor-pointer md:cursor-default pb-3 border-b border-zinc-800/80"
      >
        <h3 className="font-black font-cinzel text-amber-400 text-sm md:text-base flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-amber-400" /> Tableros de Oponentes en Vivo ({opponents.length})
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-mono font-bold hidden md:inline">
            ● Sincronizado en Tiempo Real
          </span>
          <button className="md:hidden p-1 text-amber-400">
            {isOpenMobile ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Grid of Opponent Mini Michi Boards (Visible always on desktop, collapsible on mobile) */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 ${
          isOpenMobile ? 'block' : 'hidden md:grid'
        }`}
      >
        {opponents.map((op) => {
          const isTurn = players[currentTurnIndex]?.userId
            ? players[currentTurnIndex]?.userId === op.userId
            : players[currentTurnIndex]?.socketId === op.socketId;
          const board = op.board || {};
          const details = op.boardDetails || {};
          const opEmote = activeEmotes[op.userId];

          return (
            <div
              key={op.userId || op.socketId}
              className={`p-4 rounded-2xl border transition-all relative ${
                isTurn
                  ? 'bg-gradient-to-br from-amber-950/40 via-zinc-900/90 to-zinc-950 border-amber-400/90 shadow-gold-glow animate-active-turn-pulse scale-[1.01]'
                  : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {/* Opponent Header */}
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <VipAvatar name={op.name} isTurn={isTurn} size="md" />
                    <FloatingEmote emote={opEmote} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-100 font-cinzel flex items-center gap-1.5">
                      {op.name}
                      {isTurn && (
                        <span className="text-[10px] text-amber-400 font-bold animate-ping">
                          ●
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Puntos: <strong className="text-emerald-400 font-bold">{op.totalScore || 0} pts</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-black text-amber-300 font-cinzel text-xs bg-zinc-950 px-2.5 py-1 rounded-xl border border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  {op.wins || 0}
                </div>
              </div>

              {/* Mini 3x3 Grid */}
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {MINI_GRID_CELLS.map((cell) => {
                  const val = board[cell.key];
                  const det = details[cell.key] || {};
                  const isFilled = val !== null && val !== undefined;
                  const isCrossed = det.isCrossed || val === 0;
                  const isReal = det.isReal;

                  return (
                    <div
                      key={cell.key}
                      className={`p-1.5 rounded-xl border text-center flex flex-col justify-between h-14 transition-all ${
                        isFilled
                          ? isCrossed
                            ? 'bg-zinc-950/80 border-rose-950 text-rose-500'
                            : isReal
                            ? 'bg-amber-950/50 border-amber-400/60 text-amber-300 shadow-sm'
                            : 'bg-zinc-900 border-emerald-700/60 text-emerald-300'
                          : 'bg-zinc-950/40 border-zinc-850 text-zinc-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-extrabold text-zinc-400">
                        <span>{cell.label}</span>
                        {isReal && !isCrossed && (
                          <Crown className="w-2.5 h-2.5 text-amber-400 fill-current inline" />
                        )}
                      </div>
                      <div className="my-auto font-black text-xs md:text-sm font-cinzel">
                        {isFilled ? (
                          isCrossed ? (
                            <span className="text-rose-500 font-mono">0</span>
                          ) : (
                            val
                          )
                        ) : (
                          <span className="text-zinc-700 font-normal">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom: La Grande */}
              {(() => {
                const gVal = board.grande;
                const gDet = details.grande || {};
                const isFilled = gVal !== null && gVal !== undefined;
                const isCrossed = gDet.isCrossed || gVal === 0;
                const isReal = gDet.isReal;

                return (
                  <div
                    className={`p-2 rounded-xl border text-center flex items-center justify-between px-3 ${
                      isFilled
                        ? isCrossed
                          ? 'bg-zinc-950/80 border-rose-950 text-rose-500'
                          : isReal
                          ? 'bg-amber-950/50 border-amber-400/60 text-amber-300 shadow-sm'
                          : 'bg-zinc-900 border-emerald-700/60 text-emerald-300'
                        : 'bg-zinc-950/40 border-zinc-850 text-zinc-600'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                      LA GRANDE (50)
                    </span>
                    <span className="font-black text-sm font-cinzel">
                      {isFilled ? (
                        isCrossed ? (
                          <span className="text-rose-500 font-mono">0 (Huevo)</span>
                        ) : (
                          `${gVal} pts ${isReal ? '★' : ''}`
                        )
                      ) : (
                        <span className="text-zinc-700 font-normal">Vacía</span>
                      )}
                    </span>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
