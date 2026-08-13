import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';

export default function VoiceChatControls({
  isAudioConnected,
  isMuted,
  onConnectAudio,
  onToggleMute,
  onDisconnectAudio,
}) {
  if (!isAudioConnected) {
    return (
      <button
        type="button"
        onClick={onConnectAudio}
        className="px-3.5 py-2 rounded-2xl bg-zinc-900/90 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 font-bold text-xs transition-all shadow-gold-glow hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer backdrop-blur-md"
        title="Unirse a la llamada de voz P2P de la sala"
      >
        <Mic className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
        <span className="hidden sm:inline font-cinzel">Voz en Vivo</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-950/95 border border-emerald-400/80 shadow-gold-glow backdrop-blur-md">
      {/* Live Audio Status Badge */}
      <div className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-emerald-300">
        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse stroke-[2.5]" />
        <span className="hidden sm:inline">VOZ ACTIVA</span>
      </div>

      {/* Mic Mute / Unmute Button */}
      <button
        type="button"
        onClick={onToggleMute}
        className={`p-2 rounded-xl transition-all shadow cursor-pointer flex items-center justify-center ${
          isMuted
            ? 'bg-rose-950/90 border border-rose-600 text-rose-300 hover:bg-rose-900'
            : 'bg-emerald-950/90 border border-emerald-400 text-emerald-300 hover:bg-emerald-900 shadow-gold-glow'
        }`}
        title={isMuted ? 'Desmutear Micrófono' : 'Silenciar Micrófono'}
      >
        {isMuted ? (
          <MicOff className="w-4 h-4 text-rose-400 stroke-[2.5]" />
        ) : (
          <Mic className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
        )}
      </button>

      {/* Leave Voice Call Button */}
      <button
        type="button"
        onClick={onDisconnectAudio}
        className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
        title="Salir de la llamada de voz"
      >
        <VolumeX className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
}
