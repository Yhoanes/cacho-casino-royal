import React from 'react';
import { Dices, Target, AlertTriangle } from 'lucide-react';

export default function ActionPanel({
  turnState,
  isMyTurn,
  onRoll,
  onOpenCantoModal,
  isRolling,
  player,
}) {
  const { rollsLeft, hasRolledThisTurn, cantoFailed, activeCanto, dice = [], keptDice = [], cantoResolution } = turnState;
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

  // If not local player's turn, do NOT render a duplicate status box!
  if (!isMyTurn) {
    return null;
  }

  return (
    <div className="w-full max-w-lg glass-panel-luxury rounded-3xl p-3 sm:p-4 border border-amber-500/30 shadow-2xl">
      {/* Canto Failed Warning Banner */}
      {cantoFailed && (
        <div className="mb-3 p-3 rounded-2xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs flex items-center gap-2.5 animate-bounce-short shadow-xl">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 stroke-[2.5]" />
          <div>
            <strong className="font-extrabold block text-rose-300 text-sm">¡Canto Fallado!</strong>
            Has perdido tus tiros restantes. Obligatoriamente debes presionar <strong>"Tachar"</strong> en una casilla vacía de tu tablero Michi.
          </div>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Roll Dice Button */}
        <button
          type="button"
          onClick={() => onRoll()}
          disabled={rollsLeft <= 0 || isRolling || cantoFailed || cantoResolution?.active}
          className={`w-full min-h-[50px] py-3 px-4 rounded-2xl font-black font-cinzel text-base sm:text-lg tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
            rollsLeft > 0 && !cantoFailed && !cantoResolution?.active
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 shadow-gold-glow hover:scale-[1.02] active:scale-95'
              : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
          }`}
        >
          <Dices className={`w-5 h-5 stroke-[2.5] ${isRolling ? 'animate-spin' : ''}`} />
          {hasRolledThisTurn ? 'Volver a Lanzar' : 'Lanzar Cacho'}
        </button>

        {/* Cantar Button */}
        <button
          type="button"
          onClick={handleCantarClick}
          disabled={!isCantarEnabled}
          className={`w-full min-h-[50px] py-3 px-4 rounded-2xl font-black font-cinzel text-base sm:text-lg tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
            isCantarEnabled
              ? 'bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white border border-purple-400/50 hover:scale-[1.02] active:scale-95 shadow-purple-900/40'
              : 'bg-zinc-900/60 text-zinc-600 border border-zinc-800/80 cursor-not-allowed opacity-50'
          }`}
          title={
            !isCantarValid
              ? 'Para cantar con dados guardados, todos deben tener el mismo número.'
              : 'Declarar Canto por Suma Exacta'
          }
        >
          <Target className="w-5 h-5 text-purple-300 stroke-[2.5]" />
          {activeCanto
            ? `Cantado: ${typeof activeCanto === 'string' ? activeCanto.toUpperCase() : activeCanto}`
            : hasKeptDice && allKeptSame
            ? `Cantar al ${keptTargetNumber}`
            : 'Cantar'}
        </button>
      </div>
    </div>
  );
}
