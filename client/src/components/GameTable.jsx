import React, { useState, useEffect } from 'react';
import { LogOut, Dices, ScrollText, Crown, Shield } from 'lucide-react';
import DiceCup from './DiceCup';
import MichiBoard from './MichiBoard';
import ActionPanel from './ActionPanel';
import VictoryModal from './VictoryModal';
import CantoModal from './CantoModal';
import HudAnnouncement from './HudAnnouncement';
import SocialControlsFAB from './SocialControlsFAB';
import PlayerAvatar from './PlayerAvatar';
import GameLogsModal from './GameLogsModal';

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
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col justify-between felt-table-bg vignette-overlay font-outfit select-none relative">
      {/* 1. Poker Table Top Header Bar */}
      <header className="w-full shrink-0 flex items-center justify-between glass-panel-luxury px-3 sm:px-5 py-2.5 border-b border-amber-500/30 shadow-xl z-20">
        {/* Title / Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-amber-400/40 flex items-center justify-center shadow-gold-glow">
            <Dices className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          </div>
          <h1 className="text-sm sm:text-base font-black font-cinzel text-gold-shine leading-none tracking-wide hidden xs:block">
            CACHO CASINO
          </h1>
        </div>

        {/* Opponents Poker Ring (Avatars along top) */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 overflow-x-auto px-2">
          {opponents.map((op) => {
            const opIsTurn = currentPlayer.userId ? currentPlayer.userId === op.userId : currentPlayer.socketId === op.socketId;
            const opIsHost = Boolean(hostUserId && op.userId && hostUserId === op.userId);

            return (
              <PlayerAvatar
                key={op.userId || op.socketId}
                player={op}
                isTurn={opIsTurn}
                isHost={opIsHost}
                isMe={false}
                activeEmote={activeEmotes[op.userId]}
                size="sm"
              />
            );
          })}
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline px-3 py-1 bg-zinc-950/90 border border-amber-500/50 rounded-xl font-mono text-gold-shine font-bold text-xs">
            #{room.code}
          </span>

          {/* Logs Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setIsLogsModalOpen(true)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-amber-400 text-amber-400 transition-all shadow hover:scale-105 active:scale-95 cursor-pointer"
            title="Historial de Jugadas y Clasificación"
          >
            <ScrollText className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Exit Room Button */}
          <button
            type="button"
            onClick={onLeaveRoom}
            className="p-2 rounded-xl bg-rose-950/90 hover:bg-rose-950 border border-rose-600/80 text-rose-200 transition-all shadow hover:scale-105 active:scale-95 cursor-pointer"
            title="Salir de la sala"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* 2. Center Playfield Area (Dice Cup & Roll HUD) */}
      <main className="flex-1 flex flex-col items-center justify-center min-h-0 relative py-1 transform scale-80 sm:scale-90 md:scale-100 transition-transform">
        <DiceCup
          turnState={turnState}
          isMyTurn={isMyTurn}
          onToggleKeep={onToggleKeepDie}
          isRolling={isRolling}
          activeCanto={turnState.activeCanto}
        />
      </main>

      {/* 3. Bottom Local Player Dock Area (Avatar + Michi Board + Action Buttons) */}
      <footer className="shrink-0 w-full max-w-lg mx-auto flex flex-col items-center gap-1.5 px-2 pb-2 pt-0 z-10">
        {/* Local Player Avatar Badge */}
        <div className="relative z-20">
          <PlayerAvatar
            player={localPlayer}
            isTurn={isMyTurn}
            isHost={Boolean(hostUserId && localPlayer.userId && hostUserId === localPlayer.userId)}
            isMe={true}
            activeEmote={activeEmotes[localPlayer.userId]}
            size="md"
          />
        </div>

        {/* Local Player Compact Michi Board */}
        <div className="w-full">
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

        {/* Primary Action Buttons (Lanzar / Cantar) */}
        <div className="w-full">
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
