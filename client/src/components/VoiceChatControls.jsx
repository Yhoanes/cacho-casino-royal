import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export default function VoiceChatControls({
  isAudioConnected,
  isMuted,
  onConnectAudio,
  onToggleMute,
  onDisconnectAudio,
}) {
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  const toggleSpeaker = () => {
    const nextState = !isSpeakerMuted;
    setIsSpeakerMuted(nextState);
    const audioElems = document.querySelectorAll('audio');
    audioElems.forEach((aud) => {
      aud.muted = nextState;
    });
  };

  // If not connected to audio call yet: Single compact mic button to connect!
  if (!isAudioConnected) {
    return (
      <button
        type="button"
        onClick={onConnectAudio}
        className="p-2.5 rounded-2xl bg-zinc-900/90 border border-emerald-500/60 hover:border-emerald-400 text-emerald-400 transition-all shadow-md hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer backdrop-blur-md shrink-0"
        title="Activar Voz en Vivo (Entrar al Audio de la Sala)"
      >
        <Mic className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
      </button>
    );
  }

  // When connected: 2 distinct circle buttons (1 for Mic, 1 for Speaker!)
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* 1. Micrófono Button (🎤 Green if ON, Red/Gray if OFF) */}
      <button
        type="button"
        onClick={onToggleMute}
        className={`p-2.5 rounded-2xl transition-all shadow cursor-pointer flex items-center justify-center border hover:scale-105 active:scale-95 ${
          !isMuted
            ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse'
            : 'bg-zinc-900/95 border-rose-600/80 text-rose-400 hover:bg-rose-950'
        }`}
        title={!isMuted ? 'Micrófono Encendido (Toca para silenciar)' : 'Micrófono Silenciado (Toca para encender)'}
      >
        {!isMuted ? (
          <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
        ) : (
          <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 stroke-[2.5]" />
        )}
      </button>

      {/* 2. Parlante / Altavoz Button (🔊 Green if ON, Red/Gray if OFF) */}
      <button
        type="button"
        onClick={toggleSpeaker}
        onDoubleClick={onDisconnectAudio}
        className={`p-2.5 rounded-2xl transition-all shadow cursor-pointer flex items-center justify-center border hover:scale-105 active:scale-95 ${
          !isSpeakerMuted
            ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)]'
            : 'bg-zinc-900/95 border-rose-600/80 text-rose-400 hover:bg-rose-950'
        }`}
        title={!isSpeakerMuted ? 'Parlante Encendido (Toca para silenciar sala)' : 'Parlante Silenciado (Toca para escuchar sala)'}
      >
        {!isSpeakerMuted ? (
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
        ) : (
          <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 stroke-[2.5]" />
        )}
      </button>
    </div>
  );
}
