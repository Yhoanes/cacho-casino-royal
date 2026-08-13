/**
 * socketHandlers.js
 * Socket.io events with WebRTC P2P audio signaling, Spectator mode,
 * session reconnection, host kick, voluntary exit, and offline status handling.
 */

const RoomManager = require('./RoomManager');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Player connected: ${socket.id}`);

    const broadcastRoom = (roomCode) => {
      const room = RoomManager.getRoom(roomCode);
      if (room) {
        io.to(roomCode.toUpperCase()).emit('room_updated', room);
      }
    };

    // 1. Create Room
    socket.on('create_room', ({ userId, playerName, avatar }) => {
      const room = RoomManager.createRoom(socket.id, userId, playerName, avatar);
      socket.join(room.code);
      socket.emit('room_created', { roomCode: room.code, room });
      broadcastRoom(room.code);
    });

    // 2. Join Room (Supports Late Join as Spectator!)
    socket.on('join_room', ({ roomCode, userId, playerName, avatar }) => {
      const res = RoomManager.joinRoom(roomCode, socket.id, userId, playerName, avatar);
      if (res.error) {
        return socket.emit('error_message', { message: res.error });
      }
      socket.join(res.room.code);
      socket.emit('joined_room', { roomCode: res.room.code, room: res.room, isSpectator: res.isSpectator });
      broadcastRoom(res.room.code);
    });

    // 3. Switch Mode: Active Player -> Spectator
    socket.on('switch_to_spectator', ({ roomCode, userId }) => {
      const res = RoomManager.switchToSpectator(roomCode, socket.id, userId);
      if (res.error) {
        return socket.emit('error_message', { message: res.error });
      }
      if (res.room) {
        broadcastRoom(res.roomCode || roomCode);
      }
    });

    // 4. Switch Mode: Spectator -> Active Player
    socket.on('switch_to_player', ({ roomCode, userId }) => {
      const res = RoomManager.switchToPlayer(roomCode, socket.id, userId);
      if (res.error) {
        return socket.emit('error_message', { message: res.error });
      }
      if (res.room) {
        broadcastRoom(roomCode);
      }
    });

    // 5. WebRTC P2P Audio Signaling Handlers
    socket.on('webrtc_offer', ({ targetSocketId, offer, senderUserId }) => {
      if (!targetSocketId || !offer) return;
      io.to(targetSocketId).emit('webrtc_offer', {
        senderSocketId: socket.id,
        senderUserId,
        offer,
      });
    });

    socket.on('webrtc_answer', ({ targetSocketId, answer, senderUserId }) => {
      if (!targetSocketId || !answer) return;
      io.to(targetSocketId).emit('webrtc_answer', {
        senderSocketId: socket.id,
        senderUserId,
        answer,
      });
    });

    socket.on('webrtc_candidate', ({ targetSocketId, candidate, senderUserId }) => {
      if (!targetSocketId || !candidate) return;
      io.to(targetSocketId).emit('webrtc_candidate', {
        senderSocketId: socket.id,
        senderUserId,
        candidate,
      });
    });

    socket.on('webrtc_speaking_status', ({ roomCode, userId, isSpeaking }) => {
      if (!roomCode || !userId) return;
      socket.to(roomCode.toUpperCase()).emit('player_speaking_changed', { userId, isSpeaking });
    });

    // 6. Reconnect Player (Silent Page Reload Reconnection)
    socket.on('reconnect_player', ({ roomCode, userId, playerName, avatar }) => {
      const res = RoomManager.reconnectPlayer(roomCode, socket.id, userId, playerName, avatar);
      if (res.error) {
        return socket.emit('reconnect_failed', { message: res.error });
      }
      socket.join(res.room.code);
      socket.emit('joined_room', { roomCode: res.room.code, room: res.room });
      broadcastRoom(res.room.code);
    });

    // 7. Start Game
    socket.on('start_game', ({ roomCode, userId }) => {
      const res = RoomManager.startGame(roomCode, socket.id, userId);
      if (res.error) {
        return socket.emit('error_message', { message: res.error });
      }
      broadcastRoom(roomCode);
    });

    // 8. Roll Dice
    socket.on('roll_dice', ({ roomCode, calledCantoNumber }) => {
      const res = RoomManager.rollDice(roomCode, socket.id, calledCantoNumber, io);
      if (res.error) {
        return socket.emit('error_message', { message: res.error });
      }
      broadcastRoom(roomCode);
    });

    // 9. Toggle Keep Die
    socket.on('toggle_keep_die', ({ roomCode, dieIndex }) => {
      const res = RoomManager.toggleKeepDie(roomCode, socket.id, dieIndex);
      if (res.error) {
        return socket.emit('error_message', { message: res.error });
      }
      broadcastRoom(roomCode);
    });

    // 10. Score Category
    socket.on('score_category', ({ roomCode, category }) => {
      const res = RoomManager.scoreCategory(roomCode, socket.id, category);
      if (res.error) {
        return socket.emit('error_message', { message: res.error });
      }
      broadcastRoom(roomCode);
    });

    // 11. Cross Category (0 / Huevo)
    socket.on('cross_category', ({ roomCode, category }) => {
      const res = RoomManager.crossCategory(roomCode, socket.id, category);
      if (res.error) {
        return socket.emit('error_message', { message: res.error });
      }
      broadcastRoom(roomCode);
    });

    // 12. Rematch / Next Game
    socket.on('rematch', ({ roomCode, userId }) => {
      const res = RoomManager.rematchGame(roomCode, socket.id, userId);
      if (res.error) {
        return socket.emit('error_message', { message: res.error });
      }
      broadcastRoom(roomCode);
    });

    // 13. Kick Player (Host Privilege)
    socket.on('kick_player', ({ roomCode, requesterUserId, targetUserId }) => {
      const res = RoomManager.kickPlayer(roomCode, socket.id, requesterUserId, targetUserId);
      if (res.error) {
        return socket.emit('error_message', { message: res.error });
      }
      if (res.kickedSocketId) {
        io.to(res.kickedSocketId).emit('kicked_from_room', {
          message: 'Has sido expulsado de la sala por el Anfitrión.',
        });
      }
      broadcastRoom(roomCode);
    });

    // 14. Voluntary Leave Room
    socket.on('leave_room', ({ roomCode, userId }) => {
      const res = RoomManager.leaveRoom(roomCode, socket.id, userId);
      if (res) {
        socket.leave(roomCode.toUpperCase());
        socket.emit('left_room_success');
        if (res.room) {
          broadcastRoom(res.roomCode);
        }
      }
    });

    // 15. Disconnect (Mark Offline tolerance)
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Player disconnected: ${socket.id}`);
      const res = RoomManager.disconnectPlayer(socket.id);
      if (res) {
        broadcastRoom(res.roomCode);
      }
    });

    // 16. In-Game Chat Message
    socket.on('send_chat_message', ({ roomCode, userId, senderName, text }) => {
      if (!roomCode || !text || !text.trim()) return;
      const room = RoomManager.getRoom(roomCode);
      if (!room) return;

      const chatMsg = {
        id: Date.now() + Math.random().toString(36).substr(2, 4),
        userId,
        senderName: senderName || 'Jugador',
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      io.to(roomCode.toUpperCase()).emit('receive_chat_message', chatMsg);
    });

    // 17. Express Emote Reaction
    socket.on('send_emote', ({ roomCode, userId, senderName, emote }) => {
      if (!roomCode || !emote) return;
      const room = RoomManager.getRoom(roomCode);
      if (!room) return;

      const emoteEvent = {
        id: Date.now() + Math.random().toString(36).substr(2, 4),
        userId,
        senderName: senderName || 'Jugador',
        emote,
      };

      io.to(roomCode.toUpperCase()).emit('show_emote', emoteEvent);
    });
  });
}

module.exports = setupSocketHandlers;
