import React, { useState } from 'react';
import { Smile, Flame } from 'lucide-react';

const RIVALRY_EMOTES = [
  { char: '🤣', title: 'Risa / Me río de tu fallo' },
  { char: '🤡', title: 'Payaso / Jugada tonta' },
  { char: '💀', title: 'Calavera / Te rayaste' },
  { char: '🤫', title: 'Silencio / Te callé' },
  { char: '🤬', title: 'Rabia / Me rayé' },
  { char: '🤑', title: 'Suerte / Tiro perfecto' },
];

export default function ExpressEmotesBar({ onSendEmote }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmoteClick = (emoteChar) => {
    onSendEmote(emoteChar);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 select-none">
      <div className="relative flex items-center gap-2">
        {/* Main Floating Asynchronous Reaction Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3.5 rounded-full shadow-gold-glow border transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer ${
            isOpen
              ? 'bg-amber-400 text-zinc-950 border-amber-300'
              : 'bg-zinc-950/90 text-amber-400 border-amber-500/50 hover:border-amber-400'
          }`}
          title="Reacciones de Rivalidad (Emotes Asíncronos)"
        >
          <Smile className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Horizontal Popover Bar with Rivalry Emotes */}
        {isOpen && (
          <div className="flex items-center gap-1.5 p-2 rounded-2xl glass-panel-gold border-2 border-amber-400/80 shadow-2xl animate-fade-in">
            {RIVALRY_EMOTES.map((em) => (
              <button
                key={em.char}
                type="button"
                onClick={() => handleEmoteClick(em.char)}
                className="p-2.5 rounded-xl text-2xl hover:bg-amber-500/30 hover:scale-125 transition-all text-center cursor-pointer active:scale-90"
                title={em.title}
              >
                {em.char}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
