import React from 'react';
import { Crown } from 'lucide-react';
import VipAvatar from './VipAvatar';
import FloatingEmote from './FloatingEmote';

export default function PlayerAvatar({
  player,
  isTurn = false,
  isHost = false,
  isMe = false,
  activeEmote = null,
  size = 'md',
}) {
  if (!player) return null;
  const name = player.name || 'Jugador';
  const score = player.totalScore || 0;

  return (
    <div className="relative flex flex-col items-center group select-none">
      {/* Floating Animated Emote Overlay over Avatar */}
      {activeEmote && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 animate-bounce bg-zinc-950/95 border-2 border-amber-400 rounded-full px-3 py-0.5 text-xl shadow-gold-glow whitespace-nowrap pointer-events-none">
          {activeEmote}
        </div>
      )}

      {/* Avatar Token Circle */}
      <div className="relative">
        <VipAvatar name={name} isTurn={isTurn} size={size} />

        {/* Host Crown Badge */}
        {isHost && (
          <div className="absolute -top-2 -right-1 p-0.5 rounded-full bg-amber-950 border border-amber-400 shadow-sm" title="Anfitrión">
            <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
          </div>
        )}

        {/* Offline Red Indicator */}
        {player.isOffline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-600 rounded-full border-2 border-zinc-950" title="Offline" />
        )}
      </div>

      {/* Compact Name & Points Pill */}
      <div className={`mt-1 px-2.5 py-0.5 rounded-full border text-center transition-all max-w-[100px] truncate ${
        isTurn
          ? 'bg-gradient-to-r from-amber-500/30 via-amber-400/20 to-amber-500/30 border-amber-400/80 text-amber-300 shadow-sm font-extrabold'
          : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 font-semibold'
      }`}>
        <div className="text-[10px] leading-tight truncate flex items-center justify-center gap-1">
          <span className="truncate">{name}</span>
          {isMe && <span className="text-[8px] text-amber-400 font-black">(Tú)</span>}
        </div>
        <div className="text-[9px] font-mono text-emerald-400 font-bold leading-none mt-0.5">
          {score} pts
        </div>
      </div>
    </div>
  );
}
