import React, { useState, useEffect } from 'react';
import { LogOut, Dices, ScrollText, BarChart3, DoorOpen } from 'lucide-react';
import DiceCup from './DiceCup';
import MichiBoard from './MichiBoard';
import ActionPanel from './ActionPanel';
import VictoryModal from './VictoryModal';
import CantoModal from './CantoModal';
import HudAnnouncement from './HudAnnouncement';
import SocialControlsFAB from './SocialControlsFAB';
import PlayerAvatar from './PlayerAvatar';
import GameLogsModal from './GameLogsModal';
import OpponentsOverviewModal from './OpponentsOverviewModal';

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
  const [isOpponentsOverviewOpen, setIsOpponentsOverviewOpen] = useState(false);
  const [showCantoResolutionOverlay, setShowCantoResolutionOverlay] = useState(false);

  const { players = [], currentTurnIndex, turnState = {}, status, winner, winReason, hostUserId } = room;

  const currentPlayer = players[currentTurnIndex] || {};
  const localPlayer = players.find((p) => (p.userId ? p.userId === currentUserId : p.socketId === currentSocketId)) || currentPlayer;
  const isMyTurn = currentPlayer.userId ? currentPlayer.userId === currentUserId : currentPlayer.socketId === currentSocketId;
  const isHost = Boolean(hostUserId && currentUserId && hostUserId === currentUserId);

  // All players list (for Left HUD: local player + opponents)
  const allPlayers = players;
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
    <div className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-700 via-emerald-950 to-zinc-950 relative w-full h-[100dvh] overflow-hidden select-none font-outfit">
      {/* 1. HUD Left Dock (Unclipped Avatars Floating Over Everything - z-[999]) */}
      <div className="fixed left-3 sm:left-5 top-16 sm:top-20 flex flex-col gap-4 sm:gap-5 z-[999] overflow-visible pointer-events-auto">
        {allPlayers.map((p) => {
          const pIsTurn = currentPlayer.userId ? currentPlayer.userId === p.userId : currentPlayer.socketId === p.socketId;
          const pIsHost = Boolean(hostUserId && p.userId && hostUserId === p.userId);
          const isMe = p.userId ? p.userId === currentUserId : p.socketId === currentSocketId;

          return (
            <PlayerAvatar
              key={p.userId || p.socketId}
              player={p}
              isTurn={pIsTurn}
              isHost={pIsHost}
              isMe={isMe}
              activeEmote={activeEmotes[p.userId]}
              size="sm"
              onClick={() => setIsOpponentsOverviewOpen(true)}
            />
          );
        })}
      </div>

      {/* 2. HUD Top-Right Controls Bar (3 Floating Buttons: Historial, Espiar, Salir) */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-2 sm:gap-3 z-50">
        {/* Historial de Jugadas Button (📜) */}
        <button
          type="button"
          onClick={() => setIsLogsModalOpen(true)}
          className="p-2.5 sm:p-3 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 hover:border-amber-400 text-amber-400 transition-all shadow-gold-glow hover:scale-105 active:scale-95 flex items-center gap-1.5 font-bold text-xs cursor-pointer"
          title="Historial de Jugadas"
        >
          <ScrollText className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          <span className="hidden md:inline font-cinzel">Historial</span>
        </button>

        {/* Espiar Rivales Button (📊) */}
        <button
          type="button"
          onClick={() => setIsOpponentsOverviewOpen(true)}
          className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border border-amber-400 text-amber-300 transition-all shadow-gold-glow hover:scale-105 active:scale-95 flex items-center gap-1.5 font-extrabold text-xs cursor-pointer"
          title="Espiar Rivales (Tableros)"
        >
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] text-amber-400" />
          <span className="hidden md:inline font-cinzel">Espiar Rivales</span>
        </button>

        {/* Salir de la Sala Button (🚪) */}
        <button
          type="button"
          onClick={onLeaveRoom}
          className="p-2.5 sm:p-3 rounded-2xl bg-rose-950/90 hover:bg-rose-950 border border-rose-600/80 text-rose-200 transition-all shadow hover:scale-105 active:scale-95 flex items-center gap-1.5 font-bold text-xs cursor-pointer"
          title="Salir de la Sala"
        >
          <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 3. Center Arena Stage (Pure Transparent Michi Board & Clean Dice Tray) */}
      <main className="absolute top-[44%] sm:top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-8 sm:gap-10 md:gap-12 w-full z-10">
        {/* Pure Physical Dice Tray */}
        <div className="w-full flex justify-center transform scale-90 sm:scale-100 transition-transform">
          <DiceCup
            turnState={turnState}
            isMyTurn={isMyTurn}
            onToggleKeep={onToggleKeepDie}
            isRolling={isRolling}
            activeCanto={turnState.activeCanto}
          />
        </div>

        {/* Local Player Transparent Michi Board */}
        <div className="w-full max-w-sm sm:max-w-md bg-transparent border-0 p-0 shadow-none scale-85 sm:scale-95 md:scale-100 origin-top transition-transform pb-14 sm:pb-16">
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
      </main>

      {/* 4. Single Floating Status Pill */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-amber-400/80 text-amber-300 px-6 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl z-30 pointer-events-none whitespace-nowrap flex items-center gap-2">
        {isMyTurn ? (
          turnState.hasRolledThisTurn ? (
            turnState.rollsLeft > 0 ? (
              <span>👇 Toca los dados para Guardar o Liberar</span>
            ) : (
              <span>⚠️ Sin tiros. Selecciona casilla para anotar o tachar</span>
            )
          ) : (
            <span>🎲 ¡Es tu turno! Lanza los dados</span>
          )
        ) : (
          <span>⏳ Turno de {currentPlayer.name}...</span>
        )}
      </div>

      {/* 5. HUD Bottom Action Controls (Lanzar Cacho & Cantar Buttons) */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex justify-center gap-3 sm:gap-4 w-[90%] max-w-md z-50">
        <ActionPanel
          turnState={turnState}
          isMyTurn={isMyTurn}
          onRoll={(cantoData) => handleRollClick(cantoData)}
          onOpenCantoModal={() => setIsCantoModalOpen(true)}
          isRolling={isRolling}
          player={localPlayer}
        />
      </div>

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

      {/* Opponents Overview Modal (Espiar Rivales - 📊) */}
      <OpponentsOverviewModal
        isOpen={isOpponentsOverviewOpen}
        onClose={() => setIsOpponentsOverviewOpen(false)}
        opponents={opponents}
      />

      {/* Game Logs & Leaderboard Modal (📜) */}
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
