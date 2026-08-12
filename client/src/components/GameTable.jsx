import React, { useState, useEffect } from 'react';
import { LogOut, Dices, ScrollText } from 'lucide-react';
import DiceCup from './DiceCup';
import MichiBoard from './MichiBoard';
import ActionPanel from './ActionPanel';
import VictoryModal from './VictoryModal';
import CantoModal from './CantoModal';
import HudAnnouncement from './HudAnnouncement';
import SocialControlsFAB from './SocialControlsFAB';
import PlayerAvatar from './PlayerAvatar';
import GameLogsModal from './GameLogsModal';

const getOpponentPositionClass = (index) => {
  switch (index) {
    case 0:
      return 'absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-20';
    case 1:
      return 'absolute top-24 sm:top-28 left-2 sm:left-6 z-20';
    case 2:
      return 'absolute top-24 sm:top-28 right-2 sm:right-6 z-20';
    case 3:
      return 'absolute top-[38%] sm:top-[40%] left-2 sm:left-6 -translate-y-1/2 z-20';
    case 4:
      return 'absolute top-[38%] sm:top-[40%] right-2 sm:right-6 -translate-y-1/2 z-20';
    default:
      return 'absolute top-14 left-1/2 -translate-x-1/2 z-20';
  }
};

export default function GameTable({
  room,
  currentSocketId,
  currentUserId,
  onRollDice,
  onToggleKeepDie,
  onScoreCategory,
  onCrossCategory,
  onRematch,
  onKickPlayer,
  onLeaveRoom,
  chatMessages = [],
  activeEmotes = {},
  onSendMessage,
  onSendEmote,
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [isCantoModalOpen, setIsCantoModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [showCantoResolutionOverlay, setShowCantoResolutionOverlay] = useState(false);

  const { players = [], currentTurnIndex, turnState = {}, status, winner, winReason, hostUserId } = room;

  const currentPlayer = players[currentTurnIndex] || {};
  const localPlayer = players.find((p) => (p.userId ? p.userId === currentUserId : p.socketId === currentSocketId)) || currentPlayer;
  const isMyTurn = currentPlayer.userId ? currentPlayer.userId === currentUserId : currentPlayer.socketId === currentSocketId;
  const isHost = Boolean(hostUserId && currentUserId && hostUserId === currentUserId);

  // Opponents list (excluding local player)
  const opponents = players.filter((p) => (p.userId ? p.userId !== currentUserId : p.socketId !== currentSocketId));

  useEffect(() => {
    if (turnState?.cantoResolution?.active) {
      setShowCantoResolutionOverlay(false);
      const timer = setTimeout(() => {
        setShowCantoResolutionOverlay(true);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setShowCantoResolutionOverlay(false);
    }
  }, [turnState?.cantoResolution?.active]);

  const handleRollClick = (cantoData = null) => {
    if (!isMyTurn || turnState.rollsLeft <= 0) return;
    setIsRolling(true);
    setTimeout(() => {
      setIsRolling(false);
    }, 600);
    onRollDice(cantoData);
  };

  const calculateClientScoringOptions = (dice, isReal, board) => {
    if (!dice || dice.length !== 5 || !board) return {};

    const freq = {};
    for (let i = 1; i <= 6; i++) freq[i] = 0;
    dice.forEach((d) => (freq[d] = (freq[d] || 0) + 1));

    const sorted = [...dice].sort((a, b) => a - b).join('');
    const isEscalera = sorted === '12345' || sorted === '23456' || sorted === '13456';
    const counts = Object.values(freq).filter((c) => c > 0);
    const isPanza = (counts.length === 2 && counts.includes(3) && counts.includes(2)) || counts.length === 1;
    const isPoker = Object.values(freq).some((c) => c >= 4);
    const isGrande = Object.values(freq).some((c) => c === 5);

    return {
      balas: { score: freq[1] * 1, isReal: isReal && freq[1] > 0, canScore: board.balas === null && freq[1] > 0 },
      tontos: { score: freq[2] * 2, isReal: isReal && freq[2] > 0, canScore: board.tontos === null && freq[2] > 0 },
      trenes: { score: freq[3] * 3, isReal: isReal && freq[3] > 0, canScore: board.trenes === null && freq[3] > 0 },
      cuadras: { score: freq[4] * 4, isReal: isReal && freq[4] > 0, canScore: board.cuadras === null && freq[4] > 0 },
      quinas: { score: freq[5] * 5, isReal: isReal && freq[5] > 0, canScore: board.quinas === null && freq[5] > 0 },
      senas: { score: freq[6] * 6, isReal: isReal && freq[6] > 0, canScore: board.senas === null && freq[6] > 0 },
      escalera: { score: isEscalera ? (isReal ? 25 : 20) : 0, isReal: isReal && isEscalera, canScore: board.escalera === null && isEscalera },
      panza: { score: isPanza ? (isReal ? 35 : 30) : 0, isReal: isReal && isPanza, canScore: board.panza === null && isPanza },
      poker: { score: isPoker ? (isReal ? 45 : 40) : 0, isReal: isReal && isPoker, canScore: board.poker === null && isPoker },
      grande: { score: isGrande ? 50 : 0, isReal: isReal && isGrande, canScore: board.grande === null && isGrande },
    };
  };

  const scoringOptions = calculateClientScoringOptions(
    turnState.dice,
    turnState.isReal,
    localPlayer.board || {}
  );

  return (
    <div className="relative w-full h-[100dvh] felt-table-bg vignette-overlay overflow-hidden select-none font-outfit">
      {/* 1. Poker Table Decorative Border Inlay */}
      <div className="absolute inset-3 sm:inset-5 rounded-[2.5rem] sm:rounded-[3.5rem] border-4 border-emerald-800/60 bg-emerald-950/20 pointer-events-none z-0" />

      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between glass-panel-luxury px-3 py-2 border-b border-amber-500/30 shadow-md z-40 relative">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-amber-400/40 flex items-center justify-center shadow-gold-glow">
            <Dices className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          </div>
          <span className="text-xs font-black font-cinzel text-gold-shine tracking-wider">
            CACHO
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-amber-300 font-bold">
          <span>Turno: <strong className="text-white">{currentPlayer.name}</strong></span>
          <span className="hidden xs:inline">• Sala: #{room.code}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsLogsModalOpen(true)}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:border-amber-400 text-amber-400 transition-all shadow"
            title="Historial de Jugadas"
          >
            <ScrollText className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="p-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-950 border border-rose-600/80 text-rose-200 transition-all shadow"
            title="Salir de la sala"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Absolute Opponents Ring (Poker Ring Array) */}
      {opponents.map((op, idx) => {
        const opIsTurn = currentPlayer.userId ? currentPlayer.userId === op.userId : currentPlayer.socketId === op.socketId;
        const opIsHost = Boolean(hostUserId && op.userId && hostUserId === op.userId);
        const posClass = getOpponentPositionClass(idx);

        return (
          <div key={op.userId || op.socketId} className={posClass}>
            <PlayerAvatar
              player={op}
              isTurn={opIsTurn}
              isHost={opIsHost}
              isMe={false}
              activeEmote={activeEmotes[op.userId]}
              size="sm"
            />
          </div>
        );
      })}

      {/* 3. Center Playfield Area (Centered Dice Cup & Dice Tray) */}
      <main className="absolute top-[42%] sm:top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center scale-85 sm:scale-95 md:scale-100 transition-all">
        <DiceCup
          turnState={turnState}
          isMyTurn={isMyTurn}
          onToggleKeep={onToggleKeepDie}
          isRolling={isRolling}
          activeCanto={turnState.activeCanto}
        />
      </main>

      {/* 4. Bottom Local Player Dock Area (Avatar + Michi Board + Action Buttons) */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center pb-2 px-2 z-40">
        {/* Local Player Avatar Badge */}
        <div className="relative z-30 mb-0.5">
          <PlayerAvatar
            player={localPlayer}
            isTurn={isMyTurn}
            isHost={Boolean(hostUserId && localPlayer.userId && hostUserId === localPlayer.userId)}
            isMe={true}
            activeEmote={activeEmotes[localPlayer.userId]}
            size="sm"
          />
        </div>

        {/* Local Player Ultra Compact Michi Board */}
        <div className="w-full max-w-sm">
          <MichiBoard
            player={localPlayer}
            isCurrentTurnPlayer={isMyTurn}
            turnState={turnState}
            scoringOptions={scoringOptions}
            onScore={onScoreCategory}
            onCross={onCrossCategory}
            activeEmote={null}
            hideHeader={true}
          />
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full max-w-sm mt-1">
          <ActionPanel
            turnState={turnState}
            isMyTurn={isMyTurn}
            onRoll={(cantoData) => handleRollClick(cantoData)}
            onOpenCantoModal={() => setIsCantoModalOpen(true)}
            isRolling={isRolling}
            player={localPlayer}
          />
        </div>
      </footer>

      {/* Sleek Floating Top HUD Canto Announcement */}
      <HudAnnouncement
        cantoResolution={turnState.cantoResolution}
        isVisible={showCantoResolutionOverlay}
      />

      {/* Mobile-First Unconditional Social Controls FAB (Bottom Right) */}
      <SocialControlsFAB
        roomCode={room.code}
        currentUserId={currentUserId}
        chatMessages={chatMessages}
        onSendMessage={onSendMessage}
        onSendEmote={onSendEmote}
      />

      {/* Game Logs & Leaderboard Modal */}
      <GameLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        room={room}
        currentSocketId={currentSocketId}
        currentUserId={currentUserId}
        onKickPlayer={onKickPlayer}
      />

      {/* Modals */}
      <CantoModal
        isOpen={isCantoModalOpen}
        onClose={() => setIsCantoModalOpen(false)}
        onConfirmCanto={(cantoData) => handleRollClick(cantoData)}
        player={localPlayer}
        keptDice={turnState.keptDice}
        dice={turnState.dice}
      />

      <VictoryModal
        isOpen={status === 'GAME_OVER'}
        winner={winner}
        winReason={winReason}
        players={players}
        isHost={isHost}
        onRematch={onRematch}
      />
    </div>
  );
}
