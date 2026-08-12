import React, { useState } from 'react';
import { X, ScrollText, Copy, Check, Trophy, Crown, UserMinus, Shield } from 'lucide-react';
import VipAvatar from './VipAvatar';

export default function GameLogsModal({
  isOpen,
  onClose,
  room,
  currentSocketId,
  currentUserId,
  onKickPlayer,
}) {
  const [copied, setCopied] = useState(false);
  if (!isOpen || !room) return null;

  const { code, players = [], gameLogs = [], gameRound, hostUserId } = room;
  const isHost = Boolean(hostUserId && currentUserId && hostUserId === currentUserId);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md glass-panel-gold rounded-3xl p-5 shadow-gold-glow border-2 border-amber-400/80 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-amber-400 stroke-[2.5]" />
            <h3 className="font-black font-cinzel text-amber-400 text-lg">
              Historial y Jugadores
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Room Code Info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/90 border border-amber-500/30">
            <div>
              <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest block">
                Partida #{gameRound || 1}
              </span>
              <span className="font-black font-cinzel text-white text-base">
                Sala: <strong className="text-gold-shine">{code}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          {/* Players Table */}
          <div className="bg-zinc-950/90 rounded-2xl p-3 border border-zinc-800/80">
            <div className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mb-2 flex justify-between">
              <span>Jugadores ({players.length})</span>
              <span>Victorias 🏆</span>
            </div>
            <div className="space-y-2">
              {players.map((p) => {
                const isPlayerHost = Boolean(hostUserId && p.userId && p.userId === hostUserId);
                const isMe = p.userId === currentUserId || p.socketId === currentSocketId;
                const canKick = isHost && !isMe;

                return (
                  <div
                    key={p.userId || p.socketId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <VipAvatar name={p.name} size="xs" />
                      <div>
                        <span className="font-extrabold text-white flex items-center gap-1">
                          {p.name}
                          {isPlayerHost && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          {isMe && <span className="text-[9px] text-amber-400 font-bold">(Tú)</span>}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Puntos: <strong className="text-emerald-400">{p.totalScore || 0}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canKick && (
                        <button
                          type="button"
                          onClick={() => onKickPlayer(p.userId)}
                          className="p-1 rounded-lg bg-red-950/90 hover:bg-red-900 border border-red-700/80 text-red-300 text-xs"
                          title="Expulsar jugador"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="font-black text-amber-300 font-cinzel text-xs bg-zinc-950 px-2 py-0.5 rounded-lg border border-amber-500/30">
                        🏆 {p.wins || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Game Logs Feed */}
          <div>
            <div className="text-[10px] uppercase font-black text-amber-400 tracking-widest mb-1.5 flex items-center gap-1">
              <ScrollText className="w-3.5 h-3.5" /> Historial Reciente
            </div>
            <div className="h-40 overflow-y-auto space-y-1.5 p-2.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              {gameLogs.slice(-20).reverse().map((log, lIdx) => (
                <div key={lIdx} className="leading-snug hover:text-zinc-200">
                  • {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
