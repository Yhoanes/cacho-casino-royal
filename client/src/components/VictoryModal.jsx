import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Crown, Award, Flame, Sparkles } from 'lucide-react';
import VipAvatar from './VipAvatar';

export default function VictoryModal({
  isOpen,
  winner,
  winReason,
  players = [],
  isHost,
  onRematch,
}) {
  useEffect(() => {
    if (isOpen) {
      // Multi-stage prolonged fireworks explosion for Casino Victory
      try {
        const duration = 3.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          const particleCount = 60 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#d4af37', '#fef08a', '#10b981', '#ffffff'],
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#d4af37', '#fef08a', '#f59e0b', '#ffffff'],
          });
        }, 250);
      } catch (e) {
        console.error('Confetti error:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen || !winner) return null;

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const getReasonTitle = () => {
    switch (winReason) {
      case 'TUTI':
        return {
          title: '¡VICTORIA INSTANTÁNEA POR TUTI!',
          subtitle: '¡Combinación Real de 5 dados en un solo tiro o Canto de Suma Exacta perfecto!',
          icon: <Flame className="w-12 h-12 text-amber-300 animate-bounce" />,
          color: 'from-amber-300 via-yellow-200 to-amber-500',
        };
      case '3_REALES':
        return {
          title: '¡VICTORIA POR LAS 3 REALES!',
          subtitle: 'Logró Escalera Real, Panza Real y Póker Real en una sola partida.',
          icon: <Crown className="w-12 h-12 text-amber-300 animate-pulse" />,
          color: 'from-amber-300 via-purple-300 to-amber-500',
        };
      default:
        return {
          title: '¡CAMPEÓN POR PUNTOS!',
          subtitle: 'Completó la partida con la mayor puntuación en el tablero Michi.',
          icon: <Award className="w-12 h-12 text-emerald-400" />,
          color: 'from-emerald-300 via-amber-300 to-emerald-500',
        };
    }
  };

  const reasonInfo = getReasonTitle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel-gold rounded-3xl p-6 md:p-8 shadow-gold-glow text-center overflow-hidden border-2 border-amber-400/80">
        {/* Glow backdrop aura */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        {/* Winner Badge Emblem */}
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 p-1.5 shadow-gold-glow flex items-center justify-center animate-bounce-short">
          <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center border border-amber-300/60 shadow-inner">
            {reasonInfo.icon}
          </div>
        </div>

        <h2 className="text-2xl md:text-4xl font-black font-cinzel text-gold-shine tracking-wider mb-1 drop-shadow-xl">
          {reasonInfo.title}
        </h2>
        <p className="text-xs md:text-sm text-zinc-300 mb-6 font-medium leading-relaxed">
          {reasonInfo.subtitle}
        </p>

        {/* Winner Spotlight Card */}
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-amber-950/80 border border-amber-400/60 rounded-2xl p-4 mb-6 shadow-2xl">
          <div className="flex items-center justify-center gap-4">
            <VipAvatar name={winner.name} size="xl" isTurn={true} />
            <div className="text-left">
              <span className="text-[10px] uppercase text-amber-300 font-black tracking-widest block">
                🏆 Gran Ganador
              </span>
              <h3 className="text-xl md:text-2xl font-black font-cinzel text-white leading-tight">
                {winner.name}
              </h3>
              <p className="text-xs text-zinc-300 font-mono">
                Puntaje Final: <strong className="text-amber-300 font-extrabold">{winner.totalScore} pts</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard Table Breakdown */}
        <div className="mb-6 bg-zinc-950/90 rounded-2xl p-4 border border-zinc-800 text-left shadow-inner">
          <h4 className="text-[11px] uppercase font-black text-amber-400 tracking-widest mb-2.5 font-cinzel">
            Tabla Final de la Partida
          </h4>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {players
              .slice()
              .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
              .map((p, idx) => (
                <div
                  key={p.userId || p.socketId || idx}
                  className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-zinc-900/80 border border-zinc-800 font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-amber-400">#{idx + 1}</span>
                    <VipAvatar name={p.name} size="xs" />
                    <span className="font-bold text-white">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold">
                    <span>{p.totalScore || 0} pts</span>
                    <span className="text-amber-300 font-extrabold flex items-center gap-0.5">
                      <Trophy className="w-3 h-3 text-amber-400 fill-current" /> {p.wins || 0}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Rematch Button */}
        <button
          type="button"
          onClick={onRematch}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black font-cinzel text-lg shadow-gold-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-5 h-5 stroke-[2.5]" />
          {isHost ? 'Siguiente Partida (Rotar Saque 🎲)' : 'Solicitar Revancha'}
        </button>
      </div>
    </div>
  );
}
