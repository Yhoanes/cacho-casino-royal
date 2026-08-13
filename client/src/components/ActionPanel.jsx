import React from 'react';
import { Target, AlertTriangle } from 'lucide-react';

export default function ActionPanel({
  turnState,
  isMyTurn,
  onOpenCantoModal,
  isRolling,
  player,
}) {
  const { rollsLeft, cantoFailed, activeCanto, dice = [], keptDice = [], cantoResolution } = turnState;
  const numberKeys = ['balas', 'tontos', 'trenes', 'cuadras', 'quinas', 'senas'];
  const board = player?.board || {};
  const isGrandeEmpty = board.grande === null || board.grande === undefined;

  // Calculate kept dice values and validation
  const keptValues = dice.filter((_, idx) => keptDice[idx]);
  const hasKeptDice = keptValues.length > 0;
  const allKeptSame = hasKeptDice && keptValues.every((v) => v === keptValues[0]);
  const keptTargetNumber = hasKeptDice ? keptValues[0] : null;

  // Validation: Cantar is allowed if 0 dice kept OR (kept dice share same value AND (La Grande is empty OR target box is empty))
  const keptCategory = keptTargetNumber ? numberKeys[keptTargetNumber - 1] : null;
  const isKeptBoxEmpty = keptCategory ? (board[keptCategory] === null || board[keptCategory] === undefined) : true;

  const isCantarValid = (!hasKeptDice || allKeptSame) && (isGrandeEmpty || isKeptBoxEmpty);

  const isCantarEnabled =
    rollsLeft > 0 &&
    activeCanto === null &&
    !cantoFailed &&
    !isRolling &&
    !cantoResolution?.active &&
    isCantarValid;

  const handleCantarClick = () => {
    if (!isCantarEnabled) return;
    onOpenCantoModal();
  };

  // If not local player's turn, do NOT render
  if (!isMyTurn) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Canto Failed Warning Banner */}
      {cantoFailed && (
        <div className="mb-2 p-2.5 rounded-2xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs flex items-center gap-2 animate-bounce-short shadow-xl">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>¡Canto Fallado! Presiona "Tachar" en una casilla vacía de Mi Tablero.</span>
        </div>
      )}

      {/* Sleek Luxury Cantar Capsule (Clean & Unobtrusive) */}
      <button
        type="button"
        onClick={handleCantarClick}
        disabled={!isCantarEnabled}
        className={`px-6 py-2.5 rounded-full font-black font-cinzel text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-gold-glow cursor-pointer ${
          isCantarEnabled
            ? 'bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white border border-purple-400/80 hover:scale-105 active:scale-95 shadow-purple-900/60'
            : 'bg-zinc-950/80 text-zinc-600 border border-zinc-800/80 cursor-not-allowed opacity-50'
        }`}
        title={
          !isCantarValid
            ? 'Para cantar con dados guardados, todos deben tener el mismo número.'
            : 'Declarar Canto por Suma Exacta'
        }
      >
        <Target className="w-4 h-4 text-purple-300 stroke-[2.5]" />
        <span>
          {activeCanto
            ? `Cantado: ${typeof activeCanto === 'string' ? activeCanto.toUpperCase() : activeCanto}`
            : hasKeptDice && allKeptSame
            ? `Cantar al ${keptTargetNumber}`
            : 'Declarar Canto'}
        </span>
      </button>
    </div>
  );
}
