import React, { useState } from 'react';
import { PlusCircle, LogIn, Users, Copy, Check, Play, Sparkles, Dices, LogOut, Crown, UserMinus, ShieldCheck } from 'lucide-react';
import VipAvatar from './VipAvatar';

export default function Lobby({
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  room,
  currentSocketId,
  currentUserId,
  errorMessage,
  onKickPlayer,
  onLeaveRoom,
}) {
  const [mode, setMode] = useState('MAIN'); // 'MAIN', 'CREATE', 'JOIN'
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  // If player is inside an active lobby
  if (room) {
    const isHost = Boolean(room.hostUserId && currentUserId && room.hostUserId === currentUserId);
    const canStart = room.players.length >= 2;

    const copyCode = () => {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="w-full max-w-lg glass-panel-gold rounded-3xl p-6 md:p-8 shadow-gold-glow text-center relative border-2 border-amber-400/70">
        {/* Leave Lobby Button */}
        <button
          type="button"
          onClick={onLeaveRoom}
          className="absolute top-4 right-4 p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 hover:border-rose-600 text-zinc-400 hover:text-rose-300 transition-all text-xs font-bold flex items-center gap-1.5 shadow"
          title="Salir de la sala"
        >
          <LogOut className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Salir</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black mb-4">
          <Sparkles className="w-4 h-4 fill-current" /> Sala Multijugador Casino Royal
        </div>

        <h2 className="text-3xl font-black font-cinzel text-gold-shine mb-1">
          Código de la Sala
        </h2>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-4xl md:text-5xl font-black font-cinzel tracking-widest text-white bg-zinc-950 px-6 py-2.5 rounded-2xl border border-amber-500/50 shadow-inner">
            {room.code}
          </span>
          <button
            type="button"
            onClick={copyCode}
            className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-amber-300 transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            title="Copiar código"
          >
            {copied ? <Check className="w-6 h-6 text-emerald-400" /> : <Copy className="w-6 h-6" />}
          </button>
        </div>

        <p className="text-xs md:text-sm text-zinc-300 mb-6 font-medium">
          Comparte este código con tus amigos para que entren a la mesa (Mínimo 2 jugadores).
        </p>

        {/* Players List */}
        <div className="bg-zinc-950/90 rounded-2xl p-4 border border-zinc-800/90 mb-6 text-left shadow-inner">
          <div className="flex items-center justify-between text-xs font-black text-amber-400 uppercase tracking-widest mb-3">
            <span>Jugadores Conectados</span>
            <span>{room.players.length} en la mesa</span>
          </div>
          <div className="space-y-2">
            {room.players.map((p) => {
              const isMe = Boolean(
                (p.userId && currentUserId && p.userId === currentUserId) ||
                (p.socketId && currentSocketId && p.socketId === currentSocketId)
              );
              const isPlayerHost = Boolean(room.hostUserId && p.userId && p.userId === room.hostUserId);
              const canKick = isHost && !isMe;

              return (
                <div
                  key={p.userId || p.socketId}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    p.isOffline
                      ? 'bg-rose-950/20 border-rose-900/50 opacity-60'
                      : 'bg-zinc-900/80 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <VipAvatar name={p.name} size="md" />
                      {p.isOffline && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-600 rounded-full border-2 border-zinc-950"
                          title="Desconectado (Offline)"
                        />
                      )}
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                        {p.name}
                        {isMe && <span className="text-amber-400 text-xs font-bold">(Tú)</span>}
                        {p.isOffline && <span className="text-rose-400 text-xs font-bold">(Offline)</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPlayerHost && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/25 text-amber-300 text-[10px] font-black border border-amber-500/50 shadow-sm flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400 fill-amber-400" /> ANFITRIÓN
                      </span>
                    )}

                    {canKick && (
                      <button
                        type="button"
                        onClick={() => onKickPlayer(p.userId)}
                        className="p-1.5 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-700/80 text-red-300 text-xs font-bold transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow"
                        title="Expulsar de la sala"
                      >
                        <UserMinus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Host controls */}
        {isHost ? (
          <button
            type="button"
            onClick={() => onStartGame(room.code)}
            disabled={!canStart}
            className={`w-full py-4 rounded-2xl font-black font-cinzel text-lg flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
              canStart
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 shadow-gold-glow hover:scale-[1.02] active:scale-95'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            {canStart ? '¡Iniciar Partida de Cacho!' : 'Esperando segundo jugador...'}
          </button>
        ) : (
          <div className="p-3.5 rounded-2xl bg-zinc-950/90 text-amber-300 text-sm font-bold border border-zinc-800 flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            El anfitrión iniciará la partida pronto...
          </div>
        )}
      </div>
    );
  }

  // Welcome Landing Screen
  return (
    <div className="w-full max-w-md glass-panel-gold rounded-3xl p-6 md:p-8 shadow-gold-glow text-center border-2 border-amber-400/70">
      <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-1 shadow-gold-glow flex items-center justify-center animate-bounce-short">
        <div className="w-full h-full rounded-2xl bg-zinc-950 flex items-center justify-center text-4xl shadow-inner border border-amber-300/40">
          <Dices className="w-10 h-10 text-amber-400 stroke-[2.5]" />
        </div>
      </div>

      <h1 className="text-3xl md:text-5xl font-black font-cinzel text-gold-shine tracking-wider mb-1 drop-shadow-xl">
        CACHO CASINO
      </h1>
      <p className="text-xs md:text-sm text-zinc-300 mb-6 font-medium leading-relaxed">
        El auténtico Cacho Boliviano multijugador en tiempo real con estética de Casino 2.5D.
      </p>

      {errorMessage && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-600 text-rose-200 text-xs font-extrabold animate-bounce-short shadow-2xl flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div className="text-left">{errorMessage}</div>
        </div>
      )}

      {/* Main Buttons */}
      {mode === 'MAIN' && (
        <div className="space-y-3.5">
          <button
            type="button"
            onClick={() => setMode('CREATE')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black font-cinzel text-base flex items-center justify-center gap-2.5 shadow-gold-glow hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 stroke-[2.5]" /> Crear Nueva Sala
          </button>
          <button
            type="button"
            onClick={() => setMode('JOIN')}
            className="w-full py-4 rounded-2xl bg-zinc-950/90 hover:bg-zinc-900 text-amber-300 border-2 border-amber-500/50 font-black font-cinzel text-base flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <LogIn className="w-5 h-5 stroke-[2.5]" /> Unirse a una Sala
          </button>
        </div>
      )}

      {/* Create / Join Form */}
      {(mode === 'CREATE' || mode === 'JOIN') && (
        <div className="space-y-4 text-left">
          {/* Player Name */}
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-amber-400 mb-2">
              Tu Nombre / Apodo
            </label>
            <div className="flex items-center gap-3">
              <VipAvatar name={playerName || 'Jugador'} size="lg" />
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ej. Checho"
                maxLength={14}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-950 border-2 border-amber-500/40 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-bold"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5">
              Tu avatar VIP Monogram se generará automáticamente con tus iniciales.
            </p>
          </div>

          {/* Room Code (If Joining) */}
          {mode === 'JOIN' && (
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-amber-400 mb-2">
                Código de la Sala
              </label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="Ej. X7K9P"
                maxLength={6}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-950 border-2 border-amber-500/60 text-amber-300 font-mono text-center font-black text-xl tracking-widest placeholder-zinc-600 focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>
          )}

          {/* Action & Cancel Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setMode('MAIN')}
              className="w-1/3 py-3.5 rounded-2xl bg-zinc-900 text-zinc-400 hover:text-white font-extrabold text-sm transition-colors border border-zinc-800"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => {
                const nameToUse = playerName.trim() || 'Jugador';
                if (mode === 'CREATE') {
                  onCreateRoom(nameToUse, 'VIP');
                } else {
                  if (!roomCodeInput.trim()) {
                    return;
                  }
                  onJoinRoom(roomCodeInput.trim().toUpperCase(), nameToUse, 'VIP');
                }
              }}
              className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black font-cinzel text-sm shadow-gold-glow hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {mode === 'CREATE' ? 'Crear Sala' : 'Ingresar a Sala'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
