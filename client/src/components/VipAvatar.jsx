import React from 'react';

export default function VipAvatar({ name = 'Jugador', isTurn = false, size = 'md', className = '' }) {
  const initials = (name || 'J').trim().substring(0, 2).toUpperCase();

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size] || 'w-10 h-10 text-sm';

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-br from-zinc-800 via-zinc-950 to-black border ${
        isTurn
          ? 'border-amber-400 shadow-gold-glow scale-105'
          : 'border-amber-500/40 shadow-md'
      } flex items-center justify-center font-cinzel font-black text-amber-300 tracking-wider shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );
}
