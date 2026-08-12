import React, { useState } from 'react';
import { Trophy, Copy, Check, ScrollText, Crown, UserMinus } from 'lucide-react';
import VipAvatar from './VipAvatar';

export default function Scoreboard({ room, currentSocketId, currentUserId, onKickPlayer }) {
  const [copied, setCopied] = useState(false);
  const { code, players = [], currentTurnIndex, gameLogs = [], gameRound, startingPlayerIndex, hostUserId } = room;

  const isHost = Boolean(hostUserId && currentUserId && hostUserId === currentUserId);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-xs glass-panel-luxury rounded-3xl p-5 shadow-2xl flex flex-col justify-between border border-amber-500/20">
      <div>
        {/* Header & Room Code */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 mb-4">
          <div>
            <span className="text-[10px] uppercase font-black text-amber-400 tracking-widest block mb-0.5">
              Partida #{gameRound || 1}
            </span>
            <h3 className="font-black font-cinzel text-zinc-100 text-lg leading-none">
              Sala: <span className="text-gold-shine">{code}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={copyRoomCode}
            className="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 hover:border-amber-400 text-zinc-300 hover:text-amber-300 transition-all flex items-center gap-1.5 text-xs font-bold shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            title="Copiar código de sala"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>

        {/* Players List */}
        <div className="space-y-2.5 mb-4">
          <div className="text-[10px] uppercase font-black text-zinc-400 tracking-widest flex items-center justify-between">
            <span>Jugadores ({players.length})</span>
            <span>Victorias 🏆</span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {players.map((p, idx) => {
              const isTurn = idx === currentTurnIndex;
              const isStarter = idx === startingPlayerIndex;
              const isPlayerHost = Boolean(hostUserId && p.userId && p.userId === hostUserId);
              const isMe = p.userId === currentUserId || p.socketId === currentSocketId;
              const canKick = isHost && !isMe;

              return (
                <div
                  key={p.userId || p.socketId || idx}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    p.isOffline
                      ? 'bg-rose-950/20 border-rose-900/50 opacity-60'
                      : isTurn
                      ? 'bg-gradient-to-r from-amber-500/20 via-amber-900/20 to-zinc-900 border-amber-400/90 text-white shadow-gold-glow animate-active-turn-pulse scale-[1.02]'
                      : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="relative shrink-0">
                      <VipAvatar name={p.name} isTurn={isTurn} size="md" />
                      {p.isOffline && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-600 rounded-full border-2 border-zinc-950"
                          title="Desconectado (Offline)"
                        />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="font-extrabold text-sm truncate flex items-center gap-1.5">
                        {p.name}
                        {isPlayerHost && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" title="Anfitrión" />
                        )}
                        {isMe && <span className="text-[10px] text-amber-400 font-bold">(Tú)</span>}
                        {p.isOffline && (
                          <span className="text-[10px] text-rose-400 font-bold">(Offline)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                        <span>Puntos: <strong>{p.totalScore || 0}</strong></span>
                        {isStarter && (
                          <span className="text-amber-400 font-extrabold">• Saque</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {canKick && (
                      <button
                        type="button"
                        onClick={() => onKickPlayer(p.userId)}
                        className="p-1.5 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-700/80 text-red-300 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow flex items-center justify-center"
                        title="Expulsar jugador de la sala"
                      >
                        <UserMinus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}

                    <div className="flex items-center gap-1 font-black text-amber-300 font-cinzel text-xs bg-zinc-950/90 px-2.5 py-1 rounded-xl border border-amber-500/30 shadow-inner">
                      <Trophy className="w-3 h-3 text-amber-400 fill-current" />
                      {p.wins || 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Game Logs Feed */}
      <div className="border-t border-zinc-800/80 pt-3.5">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-300 mb-2">
          <ScrollText className="w-3.5 h-3.5 text-amber-400" />
          <span>Historial de Jugadas</span>
        </div>
        <div className="h-32 overflow-y-auto space-y-1.5 pr-1.5 text-[11px] text-zinc-400 font-mono bg-zinc-950/90 p-2.5 rounded-2xl border border-zinc-800/80 shadow-inner">
          {gameLogs.slice(-15).reverse().map((log, lIdx) => (
            <div key={lIdx} className="leading-snug hover:text-zinc-200">
              • {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
