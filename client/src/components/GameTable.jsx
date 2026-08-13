import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Dices, ScrollText, BarChart3, DoorOpen, LayoutGrid, Eye, UserPlus, Mic } from 'lucide-react';
import DiceCup from './DiceCup';
import ActionPanel from './ActionPanel';
import VictoryModal from './VictoryModal';
import CantoModal from './CantoModal';
import HudAnnouncement from './HudAnnouncement';
import SocialControlsFAB from './SocialControlsFAB';
import PlayerAvatar from './PlayerAvatar';
import GameLogsModal from './GameLogsModal';
import OpponentsOverviewModal from './OpponentsOverviewModal';
import MyBoardModal from './MyBoardModal';
import VoiceChatControls from './VoiceChatControls';
import useVoiceChat from '../hooks/useVoiceChat';

export default function GameTable({
  room,
  socket,
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
  const [isMyBoardModalOpen, setIsMyBoardModalOpen] = useState(false);
  const [showCantoResolutionOverlay, setShowCantoResolutionOverlay] = useState(false);
  const [pendingCantoData, setPendingCantoData] = useState(null);

  // WebRTC P2P Voice Chat Hook
  const {
    isAudioConnected,
    isMuted,
    speakingPlayers,
    connectAudio,
    toggleMute,
    disconnectAudio,
  } = useVoiceChat(socket, room?.code, currentUserId);

  // Unified FIFO Avatar Feed State
  const [avatarFeedState, setAvatarFeedState] = useState({});
  const feedTimersRef = useRef({});

  const { players = [], spectators = [], currentTurnIndex, turnState = {}, status, winner, winReason, hostUserId } = room;

  const currentPlayer = players[currentTurnIndex] || {};
  const isSpectator = !players.some((p) => (p.userId ? p.userId === currentUserId : p.socketId === currentSocketId));
  const localPlayer = players.find((p) => (p.userId ? p.userId === currentUserId : p.socketId === currentSocketId)) || currentPlayer;
  const isMyTurn = !isSpectator && (currentPlayer.userId ? currentPlayer.userId === currentUserId : currentPlayer.socketId === currentSocketId);
  const isHost = Boolean(hostUserId && currentUserId && hostUserId === currentUserId);

  // Combined lists for display
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

  // Helper to push new item to user's avatar feed
  const pushToAvatarFeed = (userId, type, value) => {
    if (!userId) return;

    if (feedTimersRef.current[userId]) {
      clearTimeout(feedTimersRef.current[userId]);
    }

    setAvatarFeedState((prev) => ({
      ...prev,
      [userId]: { type, value, id: Date.now() },
    }));

    feedTimersRef.current[userId] = setTimeout(() => {
      setAvatarFeedState((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }, 4000);
  };

  // Sync chat messages into unified FIFO feed
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      const latest = chatMessages[chatMessages.length - 1];
      if (latest && latest.userId && latest.text) {
        pushToAvatarFeed(latest.userId, 'chat', latest.text);
      }
    }
  }, [chatMessages]);

  // Sync active emotes into unified FIFO feed
  useEffect(() => {
    if (activeEmotes) {
      Object.entries(activeEmotes).forEach(([uId, emote]) => {
        if (emote) {
          pushToAvatarFeed(uId, 'emote', emote);
        }
      });
    }
  }, [activeEmotes]);

  // Auto-open MyBoardModal when local turn finishes all rolls or canto fails
  useEffect(() => {
    if (isMyTurn && (turnState.rollsLeft === 0 || turnState.cantoFailed)) {
      const timer = setTimeout(() => {
        setIsMyBoardModalOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, turnState.rollsLeft, turnState.cantoFailed]);

  const handleRollClick = (cantoDataOverride = null) => {
    if (isSpectator || !isMyTurn || turnState.rollsLeft <= 0) return;
    const cantoToUse = cantoDataOverride || pendingCantoData;

    setIsRolling(true);
    setTimeout(() => {
      setIsRolling(false);
    }, 600);

    onRollDice(cantoToUse);
    setPendingCantoData(null);
  };

  const handleConfirmCantoChoice = (cantoData) => {
    setPendingCantoData(cantoData);
    setIsCantoModalOpen(false);
  };

  const handleEmoteSendWithFeed = (emote) => {
    if (currentUserId) {
      pushToAvatarFeed(currentUserId, 'emote', emote);
    }
    onSendEmote(emote);
  };

  const handleSwitchToSpectator = () => {
    if (socket) {
      socket.emit('switch_to_spectator', { roomCode: room.code, userId: currentUserId });
    }
  };

  const handleSwitchToPlayer = () => {
    if (socket) {
      socket.emit('switch_to_player', { roomCode: room.code, userId: currentUserId });
    }
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
      {/* Spectator Mode Top Banner Indicator */}
      {isSpectator && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-purple-950/90 border border-purple-400 text-purple-200 px-4 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-2 shadow-xl z-50 animate-pulse">
          <Eye className="w-4 h-4 text-purple-300 stroke-[2.5]" />
          <span>ESTÁS OBSERVANDO EN MODO ESPECTADOR</span>
        </div>
      )}

      {/* 1. HUD Left Dock (Unclipped Avatars Floating Over Everything - z-[999]) */}
      <div className="fixed left-3 sm:left-5 top-16 sm:top-20 flex flex-col gap-4 sm:gap-5 z-[999] overflow-visible pointer-events-auto">
        {allPlayers.map((p) => {
          const pIsTurn = currentPlayer.userId ? currentPlayer.userId === p.userId : currentPlayer.socketId === p.socketId;
          const pIsHost = Boolean(hostUserId && p.userId && hostUserId === p.userId);
          const isMe = p.userId ? p.userId === currentUserId : p.socketId === currentSocketId;
          const feedItem = avatarFeedState[p.userId];
          const isSpeaking = Boolean(speakingPlayers[p.userId]);

          return (
            <PlayerAvatar
              key={p.userId || p.socketId}
              player={p}
              isTurn={pIsTurn}
              isHost={pIsHost}
              isMe={isMe}
              isSpeaking={isSpeaking}
              activeFeedItem={feedItem}
              size="sm"
              onClick={() => isMe ? setIsMyBoardModalOpen(true) : setIsOpponentsOverviewOpen(true)}
            />
          );
        })}

        {/* Spectators Counter Pill */}
        {spectators && spectators.length > 0 && (
          <div className="px-2.5 py-1 rounded-xl bg-purple-950/80 border border-purple-400/60 text-purple-300 text-[10px] font-bold flex items-center justify-center gap-1 shadow-lg">
            <Eye className="w-3 h-3 text-purple-400" />
            <span>Espectadores ({spectators.length})</span>
          </div>
        )}
      </div>

      {/* 2. HUD Top-Right Controls Bar (Voice Call, Spectator Switch, Mi Tablero, Historial, Espiar, Salir) */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-2 sm:gap-3 z-50">
        {/* WebRTC Live Audio Voice Controls Pill */}
        <VoiceChatControls
          isAudioConnected={isAudioConnected}
          isMuted={isMuted}
          onConnectAudio={connectAudio}
          onToggleMute={toggleMute}
          onDisconnectAudio={disconnectAudio}
        />

        {/* Mode Toggle Button: Spectator -> Join Player OR Active Player -> Spectator */}
        {isSpectator ? (
          <button
            type="button"
            onClick={handleSwitchToPlayer}
            className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all shadow-gold-glow hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer border border-emerald-300"
            title="Unirse como jugador activo a la mesa"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span className="hidden md:inline font-cinzel">Unirse a la Mesa</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSwitchToSpectator}
            className="p-2.5 sm:p-3 rounded-2xl bg-purple-950/90 hover:bg-purple-900 border border-purple-400/80 text-purple-200 font-bold text-xs transition-all shadow hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Pasar a Modo Espectador (Observar)"
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span className="hidden lg:inline font-cinzel">Espectar</span>
          </button>
        )}

        {/* Mi Tablero Floating Button (📋) */}
        {!isSpectator && (
          <button
            type="button"
            onClick={() => setIsMyBoardModalOpen(true)}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all shadow-gold-glow hover:scale-105 active:scale-95 flex items-center gap-1.5 font-black text-xs cursor-pointer ${
              isMyTurn && turnState.rollsLeft === 0
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 border-amber-300 animate-bounce-short shadow-gold-glow'
                : 'bg-zinc-900/90 border-zinc-700/80 hover:border-amber-400 text-amber-300'
            }`}
            title="Ver / Desplegar Mi Tablero Michi"
          >
            <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span className="hidden md:inline font-cinzel">Mi Tablero</span>
          </button>
        )}

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

      {/* 3. Center Arena Stage (Clean Emerald Felt Table for Cacho Cup & Dice) */}
      <main className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-4 sm:gap-6 w-full max-w-md sm:max-w-lg md:max-w-xl px-3 z-10">
        {/* Interactive Physical Dice Tray & Mouse Drag / Device Motion Cacho Cup */}
        <div className="w-full flex justify-center transform scale-100 sm:scale-105 md:scale-110 transition-transform">
          <DiceCup
            turnState={turnState}
            isMyTurn={!isSpectator && isMyTurn}
            onToggleKeep={onToggleKeepDie}
            isRolling={isRolling}
            activeCanto={turnState.activeCanto}
            pendingCantoData={pendingCantoData}
            onTriggerRoll={() => handleRollClick()}
          />
        </div>
      </main>

      {/* 4. Single Floating Status Pill */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-amber-400/80 text-amber-300 px-6 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl z-30 pointer-events-none whitespace-nowrap flex items-center gap-2">
        {isSpectator ? (
          <span>👁️ Modo Espectador: Observando a {currentPlayer.name}...</span>
        ) : isMyTurn ? (
          turnState.hasRolledThisTurn ? (
            turnState.rollsLeft > 0 ? (
              <span>👇 Toca dados para Guardar o Arrastra/Agita para Lanzar</span>
            ) : (
              <span>⚠️ Sin tiros. Abre "Mi Tablero" arriba para anotar o tachar</span>
            )
          ) : (
            <span>🎲 ¡Es tu turno! Arrastra el Cacho o agita tu móvil</span>
          )
        ) : (
          <span>⏳ Turno de {currentPlayer.name}...</span>
        )}
      </div>

      {/* 5. HUD Bottom Action Controls */}
      {!isSpectator && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex justify-center gap-3 sm:gap-4 w-[90%] max-w-md z-50">
          <ActionPanel
            turnState={turnState}
            isMyTurn={isMyTurn}
            onOpenCantoModal={() => setIsCantoModalOpen(true)}
            isRolling={isRolling}
            player={localPlayer}
          />
        </div>
      )}

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
        onSendEmote={handleEmoteSendWithFeed}
      />

      {/* Local Player "Mi Tablero" Desplegable Modal */}
      {!isSpectator && (
        <MyBoardModal
          isOpen={isMyBoardModalOpen}
          onClose={() => setIsMyBoardModalOpen(false)}
          player={localPlayer}
          isCurrentTurnPlayer={isMyTurn}
          turnState={turnState}
          scoringOptions={scoringOptions}
          onScore={onScoreCategory}
          onCross={onCrossCategory}
        />
      )}

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
      {!isSpectator && (
        <CantoModal
          isOpen={isCantoModalOpen}
          onClose={() => setIsCantoModalOpen(false)}
          onConfirmCanto={handleConfirmCantoChoice}
          player={localPlayer}
          keptDice={turnState.keptDice}
          dice={turnState.dice}
        />
      )}

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
