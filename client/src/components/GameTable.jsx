import React, { useState, useEffect } from 'react';
import { LogOut, Dices, ScrollText, Users, Eye } from 'lucide-react';
import DiceCup from './DiceCup';
import MichiBoard from './MichiBoard';
import ActionPanel from './ActionPanel';
import VictoryModal from './VictoryModal';
import CantoModal from './CantoModal';
import HudAnnouncement from './HudAnnouncement';
import SocialControlsFAB from './SocialControlsFAB';
import PlayerAvatar from './PlayerAvatar';
import GameLogsModal from './GameLogsModal';
import OpponentBoardModal from './OpponentBoardModal';

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
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [showCantoResolutionOverlay, setShowCantoResolutionOverlay] = useState(false);

  const { players = [], currentTurnIndex, turnState = {}, status, winner, winReason, hostUserId, gameLogs = [] } = room;

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
    <div className="h-[100dvh] w-full flex flex-col lg:flex-row felt-table-bg vignette-overlay overflow-hidden select-none font-outfit relative">
      {/* 1. Left/Top Game Field Zone (Zona de Juego Central ~70% space) */}
      <div className="flex-1 flex flex-col justify-center items-center relative min-h-[45vh] lg:min-h-full p-4 overflow-hidden">
        {/* Table Felt Decorative Inlay */}
        <div className="absolute inset-3 sm:inset-5 rounded-[2.5rem] sm:rounded-[3.5rem] border-4 border-emerald-800/60 bg-emerald-950/20 pointer-events-none z-0" />

        {/* Dynamic Cacho Cup & Clean Dice Tray */}
        <div className="relative z-10 my-auto transform scale-90 sm:scale-100 transition-transform">
          <DiceCup
            turnState={turnState}
            isMyTurn={isMyTurn}
            onToggleKeep={onToggleKeepDie}
            isRolling={isRolling}
            activeCanto={turnState.activeCanto}
          />
        </div>

        {/* Floating Action Buttons Container (Thumb Zone in Game Field Area) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 sm:gap-4 z-50 w-[92%] max-w-sm justify-center">
          <ActionPanel
            turnState={turnState}
            isMyTurn={isMyTurn}
            onRoll={(cantoData) => handleRollClick(cantoData)}
            onOpenCantoModal={() => setIsCantoModalOpen(true)}
            isRolling={isRolling}
            player={localPlayer}
          />
        </div>
      </div>

      {/* 2. Right/Bottom Side Control Panel (Panel de Control Lateral ~30% space) */}
      <div className="w-full lg:w-96 lg:h-full glass-panel-luxury lg:border-l border-t lg:border-t-0 border-amber-500/30 flex flex-col p-3 sm:p-4 shadow-2xl shrink-0 z-40 overflow-y-auto min-h-0 justify-between">
        {/* Control Panel Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-amber-400/40 flex items-center justify-center shadow-gold-glow">
              <Dices className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black font-cinzel text-gold-shine leading-none">
                CACHO CASINO
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                Sala: <strong className="text-amber-300">#{room.code}</strong>
              </span>
            </div>
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
        </div>

        {/* Clickable Opponents Section ("Espiar" Mechanics) */}
        <div className="shrink-0 mb-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-400 tracking-wider mb-1.5">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> Oponentes (Toca para Espiar <Eye className="w-3 h-3 inline text-amber-300" />)
            </span>
            <span className="text-zinc-500 text-[9px]">Turno: {currentPlayer.name}</span>
          </div>

          <div className="flex lg:flex-col items-center lg:items-stretch gap-2 overflow-x-auto lg:overflow-x-visible pb-1 pr-1">
            {opponents.map((op) => {
              const opIsTurn = currentPlayer.userId ? currentPlayer.userId === op.userId : currentPlayer.socketId === op.socketId;
              const opIsHost = Boolean(hostUserId && op.userId && hostUserId === op.userId);

              return (
                <div
                  key={op.userId || op.socketId}
                  className={`p-2 rounded-xl border flex items-center justify-between transition-all shrink-0 lg:shrink cursor-pointer hover:border-amber-400/80 active:scale-95 ${
                    opIsTurn
                      ? 'bg-gradient-to-r from-amber-950/90 via-zinc-900 to-zinc-950 border-amber-400/90 shadow-gold-glow animate-active-turn-pulse'
                      : 'bg-zinc-950/80 border-zinc-800'
                  }`}
                  onClick={() => setSelectedOpponent(op)}
                  title={`Haz clic para espiar el tablero de ${op.name}`}
                >
                  <PlayerAvatar
                    player={op}
                    isTurn={opIsTurn}
                    isHost={opIsHost}
                    isMe={false}
                    activeEmote={activeEmotes[op.userId]}
                    size="xs"
                  />
                  <div className="hidden lg:flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                    <Eye className="w-3.5 h-3.5" /> Espiar
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compact Internal Scrollable Log Feed */}
        <div className="hidden lg:block flex-1 min-h-[80px] max-h-[120px] overflow-y-auto text-[11px] my-2 p-2.5 bg-zinc-950/90 rounded-2xl border border-zinc-800/90 font-mono text-zinc-400 shadow-inner">
          <div className="text-[9px] uppercase font-bold text-amber-400 mb-1 flex items-center gap-1">
            <ScrollText className="w-3 h-3" /> Historial de Jugadas
          </div>
          {gameLogs.slice(-15).reverse().map((log, lIdx) => (
            <div key={lIdx} className="leading-snug hover:text-zinc-200">
              • {log}
            </div>
          ))}
        </div>

        {/* Local Player Section */}
        <div className="mt-auto shrink-0 flex flex-col items-center w-full gap-1.5 pt-2 border-t border-amber-500/20">
          <PlayerAvatar
            player={localPlayer}
            isTurn={isMyTurn}
            isHost={Boolean(hostUserId && localPlayer.userId && hostUserId === localPlayer.userId)}
            isMe={true}
            activeEmote={activeEmotes[localPlayer.userId]}
            size="sm"
          />

          <div className="w-full scale-95 sm:scale-100 transform origin-bottom transition-transform pb-12 lg:pb-0">
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
        </div>
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

      {/* Opponent Inspect Board Modal ("Espiar" Mechanics) */}
      <OpponentBoardModal
        isOpen={Boolean(selectedOpponent)}
        onClose={() => setSelectedOpponent(null)}
        opponent={selectedOpponent}
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
