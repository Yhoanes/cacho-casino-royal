import React from 'react';
import { Crown } from 'lucide-react';
import VipAvatar from './VipAvatar';

export default function PlayerAvatar({
  player,
  isTurn = false,
  isHost = false,
  isMe = false,
  activeEmote = null,
  size = 'md',
  onClick = null,
  className = '',
}) {
  if (!player) return null;
  const name = player.name || 'Jugador';
  const score = player.totalScore || 0;

  return (
    <div
      onClick={onClick || undefined}
      className={`pointer-events-auto relative overflow-visible flex flex-col items-center select-none shrink-0 z-[999] ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      {/* Floating Animated Emote Overlay (Projected to the RIGHT, z-[99999], 100% unclipped) */}
      {activeEmote && (
        <div className="absolute top-1/2 left-[115%] -translate-y-1/2 text-5xl sm:text-6xl z-[99999] animate-bounce pointer-events-none whitespace-nowrap drop-shadow-[0_10px_25px_rgba(0,0,0,0.95)]">
          {activeEmote}
        </div>
      )}

      {/* Avatar Token Circle with Active Turn Gold Ring Glow */}
      <div className={`relative rounded-full transition-all ${
        isTurn ? 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(250,204,21,0.85)] animate-pulse' : ''
      }`}>
        <VipAvatar name={name} isTurn={isTurn} size={size} />

        {/* Host Crown Badge */}
        {isHost && (
          <div className="absolute -top-2.5 -right-1 p-0.5 rounded-full bg-amber-950 border border-amber-400 shadow-sm z-30" title="Anfitrión">
            <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
          </div>
        )}

        {/* Offline Red Indicator */}
        {player.isOffline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-600 rounded-full border-2 border-zinc-950 z-30" title="Offline" />
        )}
      </div>

      {/* Legible Name & Points Dark Pill */}
      <div
        className={`mt-1.5 px-2 py-0.5 rounded-full border text-center transition-all max-w-[85px] sm:max-w-[105px] truncate shadow-md ${
          isTurn
            ? 'bg-gradient-to-r from-amber-950/90 via-zinc-900/95 to-amber-950/90 border-amber-400/90 text-amber-300 shadow-gold-glow font-extrabold'
            : 'bg-black/85 backdrop-blur-sm border-zinc-800/90 text-zinc-300 font-semibold'
        }`}
      >
        <div className="text-[10px] leading-tight truncate flex items-center justify-center gap-0.5">
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
