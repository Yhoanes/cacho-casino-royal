import React, { useState, useEffect } from 'react';
import { socket } from './services/socket';
import { getOrCreateUserId, getStoredSession, saveStoredSession, clearStoredSession } from './services/session';
import Lobby from './components/Lobby';
import GameTable from './components/GameTable';

export default function App() {
  const [room, setRoom] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [socketId, setSocketId] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [activeEmotes, setActiveEmotes] = useState({}); // { userId: emoteString }
  const [inviteCode, setInviteCode] = useState('');

  const userId = getOrCreateUserId();

  // Extract invite room code from URL parameters (?room=CODE)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        const cleanCode = roomParam.trim().toUpperCase();
        setInviteCode(cleanCode);
      }
    } catch (err) {
      console.warn('Could not parse URL invite param:', err);
    }
  }, []);

  useEffect(() => {
    // Attempt silent reconnection on socket connect if session exists in localStorage
    const attemptSilentReconnect = () => {
      const stored = getStoredSession();
      if (stored && stored.roomCode) {
        console.log('🔄 Session found in localStorage. Attempting silent reconnection to room:', stored.roomCode);
        socket.emit('reconnect_player', {
          roomCode: stored.roomCode,
          userId,
          playerName: stored.playerName,
          avatar: stored.avatar,
        });
      }
    };

    socket.on('connect', () => {
      setSocketId(socket.id);
      console.log('Connected to socket server:', socket.id);
      attemptSilentReconnect();
    });

    socket.on('room_created', ({ roomCode, room }) => {
      setRoom(room);
      setErrorMessage('');
      const host = room.players.find((p) => p.userId === userId);
      saveStoredSession({
        roomCode: room.code,
        playerName: host?.name || 'Jugador 1',
        avatar: host?.avatar || '🎲',
      });
    });

    socket.on('joined_room', ({ roomCode, room }) => {
      setRoom(room);
      setErrorMessage('');
      const p = room.players.find((p) => p.userId === userId) || room.spectators?.find((s) => s.userId === userId);
      saveStoredSession({
        roomCode: room.code,
        playerName: p?.name || 'Jugador',
        avatar: p?.avatar || '🎲',
      });
    });

    socket.on('room_updated', (updatedRoom) => {
      setRoom(updatedRoom);
      setErrorMessage('');
    });

    socket.on('receive_chat_message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('show_emote', ({ userId: emoteUserId, emote }) => {
      setActiveEmotes((prev) => ({ ...prev, [emoteUserId]: emote }));
      setTimeout(() => {
        setActiveEmotes((prev) => {
          const next = { ...prev };
          delete next[emoteUserId];
          return next;
        });
      }, 3000);
    });

    socket.on('reconnect_failed', ({ message }) => {
      console.warn('Reconnection failed:', message);
      clearStoredSession();
      setRoom(null);
    });

    socket.on('kicked_from_room', ({ message }) => {
      clearStoredSession();
      setRoom(null);
      setErrorMessage(message || 'Has sido expulsado de la sala.');
      setTimeout(() => setErrorMessage(''), 5000);
    });

    socket.on('left_room_success', () => {
      clearStoredSession();
      setRoom(null);
    });

    socket.on('error_message', ({ message }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 4000);
    });

    return () => {
      socket.off('connect');
      socket.off('room_created');
      socket.off('joined_room');
      socket.off('room_updated');
      socket.off('receive_chat_message');
      socket.off('show_emote');
      socket.off('reconnect_failed');
      socket.off('kicked_from_room');
      socket.off('left_room_success');
      socket.off('error_message');
    };
  }, [userId]);

  const handleCreateRoom = (playerName, avatar) => {
    socket.emit('create_room', { userId, playerName, avatar });
  };

  const handleJoinRoom = (roomCode, playerName, avatar) => {
    if (!roomCode) {
      setErrorMessage('Ingresa un código de sala válido.');
      return;
    }
    socket.emit('join_room', { roomCode, userId, playerName, avatar });
  };

  const handleStartGame = (roomCode) => {
    socket.emit('start_game', { roomCode, userId });
  };

  const handleRollDice = (calledCantoNumber = null) => {
    if (!room) return;
    socket.emit('roll_dice', { roomCode: room.code, calledCantoNumber });
  };

  const handleToggleKeepDie = (dieIndex) => {
    if (!room) return;
    socket.emit('toggle_keep_die', { roomCode: room.code, dieIndex });
  };

  const handleScoreCategory = (category) => {
    if (!room) return;
    socket.emit('score_category', { roomCode: room.code, category });
  };

  const handleCrossCategory = (category) => {
    if (!room) return;
    socket.emit('cross_category', { roomCode: room.code, category });
  };

  const handleRematch = () => {
    if (!room) return;
    socket.emit('rematch', { roomCode: room.code, userId });
  };

  const handleKickPlayer = (targetUserId) => {
    if (!room) return;
    socket.emit('kick_player', {
      roomCode: room.code,
      requesterUserId: userId,
      targetUserId,
    });
  };

  const handleLeaveRoom = () => {
    if (room) {
      socket.emit('leave_room', { roomCode: room.code, userId });
    }
    clearStoredSession();
    setRoom(null);
  };

  const handleSendMessage = (text) => {
    if (!room) return;
    const p = room.players.find((player) => player.userId === userId) || room.spectators?.find((s) => s.userId === userId);
    socket.emit('send_chat_message', {
      roomCode: room.code,
      userId,
      senderName: p?.name || 'Espectador',
      text,
    });
  };

  const handleSendEmote = (emote) => {
    if (!room) return;
    const p = room.players.find((player) => player.userId === userId) || room.spectators?.find((s) => s.userId === userId);
    socket.emit('send_emote', {
      roomCode: room.code,
      userId,
      senderName: p?.name || 'Espectador',
      emote,
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center">
      {!room || (room.status === 'LOBBY' && !room.spectators?.some((s) => s.userId === userId)) ? (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
          <Lobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onStartGame={handleStartGame}
            room={room}
            currentSocketId={socketId || socket.id}
            currentUserId={userId}
            errorMessage={errorMessage}
            onKickPlayer={handleKickPlayer}
            onLeaveRoom={handleLeaveRoom}
            initialRoomCode={inviteCode}
          />
        </div>
      ) : (
        <GameTable
          room={room}
          socket={socket}
          currentSocketId={socketId || socket.id}
          currentUserId={userId}
          onRollDice={handleRollDice}
          onToggleKeepDie={handleToggleKeepDie}
          onScoreCategory={handleScoreCategory}
          onCrossCategory={handleCrossCategory}
          onRematch={handleRematch}
          onKickPlayer={handleKickPlayer}
          onLeaveRoom={handleLeaveRoom}
          chatMessages={chatMessages}
          activeEmotes={activeEmotes}
          onSendMessage={handleSendMessage}
          onSendEmote={handleSendEmote}
        />
      )}
    </div>
  );
}
