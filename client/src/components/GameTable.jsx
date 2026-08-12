import React, { useState, useEffect } from 'react';
import { LogOut, Sparkles, Shield, Dices } from 'lucide-react';
import DiceCup from './DiceCup';
import MichiBoard from './MichiBoard';
import ActionPanel from './ActionPanel';
import Scoreboard from './Scoreboard';
import VictoryModal from './VictoryModal';
import CantoModal from './CantoModal';
import OpponentBoards from './OpponentBoards';
import HudAnnouncement from './HudAnnouncement';
import SocialControlsFAB from './SocialControlsFAB';

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
  const [showCantoResolutionOverlay, setShowCantoResolutionOverlay] = useState(false);

  const { players = [], currentTurnIndex, turnState = {}, status, winner, winReason, hostUserId } = room;

  const currentPlayer = players[currentTurnIndex] || {};
  const isMyTurn = currentPlayer.userId ? currentPlayer.userId === currentUserId : currentPlayer.socketId === currentSocketId;
  const isHost = Boolean(hostUserId && currentUserId && hostUserId === currentUserId);

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

  const localPlayer = players.find((p) => p.userId ? p.userId === currentUserId : p.socketId === currentSocketId) || currentPlayer;

  const scoringOptions = calculateClientScoringOptions(
    turnState.dice,
    turnState.isReal,
    localPlayer.board || {}
  );

  return (
    <div className="w-full min-h-screen felt-table-bg vignette-overlay p-4 md:p-7 pb-28 md:pb-10 flex flex-col items-center justify-between font-outfit select-none relative">
      {/* 2.5D Casino Table Header Bar */}
      <header className="w-full max-w-7xl flex items-center justify-between glass-panel-luxury px-5 py-3.5 rounded-3xl border border-amber-500/30 shadow-2xl mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-zinc-950 border border-amber-400/40 flex items-center justify-center shadow-gold-glow">
            <Dices className="w-6 h-6 text-amber-400 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black font-cinzel text-gold-shine leading-none tracking-wide">
              CACHO CASINO ROYAL
            </h1>
            <span className="text-xs text-zinc-300 font-medium flex items-center gap-1 mt-0.5">
              Turno actual: <strong className="text-amber-300 font-extrabold">{currentPlayer.name}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline px-4 py-1.5 bg-zinc-950/90 border border-amber-500/50 rounded-2xl font-mono text-gold-shine font-bold text-sm shadow-inner">
            Sala: {room.code}
          </span>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="px-4 py-2.5 rounded-2xl bg-rose-950/90 hover:bg-rose-950 border border-rose-600/80 text-rose-200 text-xs font-black transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
            title="Salir de la sala"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">Salir de Sala</span>
          </button>
        </div>
      </header>

      {/* Main Table Layout Grid */}
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scoreboard & Activity */}
        <div className="lg:col-span-3 flex justify-center">
          <Scoreboard
            room={room}
            currentSocketId={currentSocketId}
            currentUserId={currentUserId}
            onKickPlayer={onKickPlayer}
          />
        </div>

        {/* Center Column: Dice Cup & Turn Controls */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-5">
          <DiceCup
            turnState={turnState}
            isMyTurn={isMyTurn}
            onToggleKeep={onToggleKeepDie}
            isRolling={isRolling}
            activeCanto={turnState.activeCanto}
          />
          <ActionPanel
            turnState={turnState}
            isMyTurn={isMyTurn}
            onRoll={(cantoData) => handleRollClick(cantoData)}
            onOpenCantoModal={() => setIsCantoModalOpen(true)}
            isRolling={isRolling}
            player={localPlayer}
          />
        </div>

        {/* Right Column: Local Player's Fixed Michi Board */}
        <div className="lg:col-span-5 flex justify-center">
          <MichiBoard
            player={localPlayer}
            isCurrentTurnPlayer={isMyTurn}
            turnState={turnState}
            scoringOptions={scoringOptions}
            onScore={onScoreCategory}
            onCross={onCrossCategory}
            activeEmote={activeEmotes[localPlayer.userId]}
          />
        </div>
      </main>

      {/* Opponents Live Boards Grid */}
      <OpponentBoards
        players={players}
        currentTurnIndex={currentTurnIndex}
        currentSocketId={currentSocketId}
        currentUserId={currentUserId}
        activeEmotes={activeEmotes}
      />

      {/* Sleek Floating Top HUD Canto Announcement */}
      <HudAnnouncement
        cantoResolution={turnState.cantoResolution}
        isVisible={showCantoResolutionOverlay}
      />

      {/* Mobile-First Unconditional Root FAB Social Dock (Bottom Right) */}
      <SocialControlsFAB
        roomCode={room.code}
        currentUserId={currentUserId}
        chatMessages={chatMessages}
        onSendMessage={onSendMessage}
        onSendEmote={onSendEmote}
      />

      {/* Modals */}
      <CantoModal
        isOpen={isCantoModalOpen}
        onClose={() => setIsCantoModalOpen(false)}
        onConfirmCanto={(cantoData) => handleRollClick(cantoData)}
        player={currentPlayer}
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
