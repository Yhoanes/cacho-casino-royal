import React, { useState, useEffect } from 'react';
import { Target, X, Calculator, Trophy, Sparkles } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { key: 'balas', label: '1s (Balas)', icon: '🎯' },
  { key: 'tontos', label: '2s (Tontos)', icon: '🎯' },
  { key: 'trenes', label: '3s (Trenes)', icon: '🎯' },
  { key: 'cuadras', label: '4s (Cuadras)', icon: '🎯' },
  { key: 'quinas', label: '5s (Quinas)', icon: '🎯' },
  { key: 'senas', label: '6s (Senas)', icon: '🎯' },
  { key: 'escalera', label: 'Escalera', icon: '🪜' },
  { key: 'panza', label: 'Panza (Full)', icon: '🍖' },
  { key: 'poker', label: 'Póker', icon: '🃏' },
  { key: 'grande', label: 'La Grande (50)', icon: '⭐' },
];

const NUMBER_KEYS = ['balas', 'tontos', 'trenes', 'cuadras', 'quinas', 'senas'];

export default function CantoModal({
  isOpen,
  onClose,
  onConfirmCanto,
  player,
  keptDice = [],
  dice = [],
}) {
  if (!isOpen) return null;

  const keptValues = (dice || []).filter((_, idx) => keptDice && keptDice[idx]);
  const keptCount = keptValues.length;
  const unkeptCount = 5 - keptCount;
  const minSum = unkeptCount * 1;
  const maxSum = unkeptCount * 6;

  const board = player?.board || {};

  // Case A: Auto-detected category if dice are kept
  const autoCategory = keptCount > 0 ? NUMBER_KEYS[keptValues[0] - 1] : null;

  const [selectedCategory, setSelectedCategory] = useState(autoCategory || '');
  const [predictedSum, setPredictedSum] = useState(minSum);

  useEffect(() => {
    if (autoCategory) {
      setSelectedCategory(autoCategory);
    } else {
      // Pick first empty category as default selection
      const firstEmpty = CATEGORY_OPTIONS.find((c) => board[c.key] === null);
      if (firstEmpty) setSelectedCategory(firstEmpty.key);
    }
    setPredictedSum(Math.ceil((minSum + maxSum) / 2));
  }, [keptCount, minSum, maxSum, autoCategory]);

  const numSum = Number(predictedSum);
  const isValidSum = !isNaN(numSum) && numSum >= minSum && numSum <= maxSum;
  const isValidCategory = Boolean(selectedCategory && (autoCategory || board[selectedCategory] === null));
  const canConfirm = isValidSum && isValidCategory;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirmCanto({
      predictedSum: numSum,
      targetCategory: selectedCategory,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl text-center max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
          <Calculator className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-black font-cinzel text-amber-400 mb-1">
          Cantar por Suma Exacta
        </h3>

        {/* Case A vs Case B Header */}
        {keptCount > 0 ? (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold text-left">
            <span className="font-extrabold block text-amber-400 text-sm mb-0.5">
              🎯 Auto-Detección por Dados Bloqueados:
            </span>
            Has guardado {keptCount} dado(s) con el número{' '}
            <strong className="text-white text-sm font-black">{keptValues[0]}</strong>. Categoría
            objetivo auto-asignada: <strong>{autoCategory?.toUpperCase()}</strong>.
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-2xl bg-purple-950/40 border border-purple-600/40 text-purple-200 text-xs font-semibold text-left">
            <span className="font-extrabold block text-purple-300 text-sm mb-0.5 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" /> Tiro Limpio (5 dados libres):
            </span>
            ¡Si lanzas los 5 dados juntos y aciertas la suma exacta, ganas la partida inmediatamente por <strong>TUTI</strong>!
          </div>
        )}

        {/* 1. Category Selector (Case B only) */}
        {keptCount === 0 && (
          <div className="mb-4 text-left">
            <label className="block text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">
              1. Selecciona la Categoría Objetivo:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {CATEGORY_OPTIONS.map((cat) => {
                const isAvailable = board[cat.key] === null;
                const isSelected = selectedCategory === cat.key;

                return (
                  <button
                    key={cat.key}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                      !isAvailable
                        ? 'bg-zinc-950/60 border-zinc-900 opacity-40 cursor-not-allowed text-zinc-600'
                        : isSelected
                        ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md scale-[1.02]'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:border-amber-500/50'
                    }`}
                  >
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                    {!isAvailable && <span className="ml-auto text-[10px] text-zinc-600">(Lleno)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Numeric Input for Predicted Sum */}
        <div className="mb-5 text-left">
          <label className="block text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">
            2. Ingresa la Suma Exacta que Predices:
          </label>

          <div className="relative">
            <input
              type="number"
              min={minSum}
              max={maxSum}
              value={predictedSum}
              onChange={(e) => setPredictedSum(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-950 border-2 border-amber-500/60 text-amber-300 font-mono font-black text-2xl text-center shadow-inner focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="mt-2 text-xs text-zinc-300 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 text-center font-mono">
            Suma posible lanzando <strong>{unkeptCount}</strong> dado(s):{' '}
            <strong className="text-amber-400 font-bold">
              {minSum} a {maxSum}
            </strong>
          </div>

          {!isValidSum && (
            <p className="mt-1.5 text-[11px] text-rose-400 font-bold text-center">
              ⚠️ La suma debe ser un número entre {minSum} y {maxSum}.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-white font-bold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className={`w-2/3 py-3 rounded-2xl font-black font-cinzel text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
              canConfirm
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 shadow-gold-glow hover:scale-[1.02] active:scale-95'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-current" /> Confirmar Canto
          </button>
        </div>
      </div>
    </div>
  );
}
