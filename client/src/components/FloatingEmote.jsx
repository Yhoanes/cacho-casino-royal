import React from 'react';

export default function FloatingEmote({ emote }) {
  if (!emote) return null;

  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none z-50">
      <div className="bg-zinc-950/95 border-2 border-amber-400 rounded-2xl px-3 py-1 text-2xl shadow-gold-glow animate-float-up-fade flex items-center justify-center">
        {emote}
      </div>
    </div>
  );
}
