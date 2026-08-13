/**
 * RoomManager.js
 * Manages game lobbies, persistent user IDs, offline states, turn reassignments,
 * host kick privileges, spectators, and room lifecycle.
 */

const { CachoEngine } = require('./CachoEngine');

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> roomState
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(socketId, userId, hostName, avatar) {
    const roomCode = this.generateRoomCode();
    const effectiveUserId = userId || `usr_${socketId}`;

    const room = {
      code: roomCode,
      status: 'LOBBY', // 'LOBBY', 'PLAYING', 'GAME_OVER'
      hostUserId: effectiveUserId,
      players: [
        {
          userId: effectiveUserId,
          socketId: socketId,
          name: hostName || 'Jugador 1',
          avatar: avatar || '🎲',
          isOffline: false,
          wins: 0,
          board: CachoEngine.createEmptyBoard(),
          boardDetails: CachoEngine.createEmptyBoardDetails(),
          totalScore: 0,
        },
      ],
      spectators: [],
      startingPlayerIndex: 0,
      currentTurnIndex: 0,
      gameRound: 1,
      turnState: {
        rollsLeft: 3,
        dice: [1, 1, 1, 1, 1],
        keptDice: [false, false, false, false, false],
        isReal: true,
        activeCanto: null,
        hasRolledThisTurn: false,
        cantoFailed: false,
        cantoResolution: null,
      },
      winner: null,
      winReason: null,
      gameLogs: [`Sala creada por ${hostName}. Código: ${roomCode}`],
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode?.toUpperCase());
  }

  joinRoom(roomCode, socketId, userId, playerName, avatar) {
    if (!roomCode || typeof roomCode !== 'string') {
      return { error: 'Por favor, ingresa un código de sala válido.' };
    }

    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.getRoom(cleanCode);

    if (!room) {
      return { error: `La sala "${cleanCode}" no existe o el código es incorrecto.` };
    }

    if (!room.spectators) room.spectators = [];

    const effectiveUserId = userId || `usr_${socketId}`;
    const existingPlayer = room.players.find((p) => p.userId === effectiveUserId);
    const existingSpectator = room.spectators.find((s) => s.userId === effectiveUserId);

    if (existingPlayer) {
      // Reconnect to active player slot
      return this.reconnectPlayer(cleanCode, socketId, effectiveUserId, playerName, avatar);
    }

    if (existingSpectator) {
      existingSpectator.socketId = socketId;
      if (playerName) existingSpectator.name = playerName;
      return { room, isSpectator: true };
    }

    // If game is already playing or players limit (6) reached, join as spectator!
    if (room.status !== 'LOBBY' || room.players.length >= 6) {
      const newSpectator = {
        userId: effectiveUserId,
        socketId: socketId,
        name: playerName || `Espectador ${room.spectators.length + 1}`,
        avatar: avatar || '👁️',
      };
      room.spectators.push(newSpectator);
      room.gameLogs.push(`👁️ ${newSpectator.name} ingresó en Modo Espectador (Observador).`);
      return { room, isSpectator: true };
    }

    // Add as active player
    const newGuestPlayer = {
      userId: effectiveUserId,
      socketId: socketId,
      name: playerName || `Jugador ${room.players.length + 1}`,
      avatar: avatar || '🎲',
      isOffline: false,
      wins: 0,
      board: CachoEngine.createEmptyBoard(),
      boardDetails: CachoEngine.createEmptyBoardDetails(),
      totalScore: 0,
    };

    room.players.push(newGuestPlayer);
    room.gameLogs.push(`👥 ${newGuestPlayer.name} se unió a la sala como jugador.`);
    return { room, isSpectator: false };
  }

  reconnectPlayer(roomCode, socketId, userId, playerName, avatar) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'La sala no existe.' };

    const player = room.players.find((p) => p.userId === userId);
    if (!player) return { error: 'Jugador no encontrado en la sala.' };

    player.socketId = socketId;
    player.isOffline = false;
    if (playerName) player.name = playerName;
    if (avatar) player.avatar = avatar;

    room.gameLogs.push(`🔄 ${player.name} se reconectó a la sala.`);
    return { room };
  }

  switchToSpectator(roomCode, socketId, userId) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Sala no encontrada.' };

    const pIndex = room.players.findIndex((p) => p.userId === userId || p.socketId === socketId);
    if (pIndex === -1) return { error: 'Jugador no encontrado en la mesa.' };

    const player = room.players[pIndex];
    room.players.splice(pIndex, 1);

    if (!room.spectators) room.spectators = [];
    room.spectators.push({
      userId: player.userId,
      socketId: socketId,
      name: player.name,
      avatar: player.avatar,
    });

    room.gameLogs.push(`👁️ ${player.name} pasó a Modo Espectador.`);

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return { roomCode, room: null };
    }

    if (player.userId === room.hostUserId) {
      room.hostUserId = room.players[0].userId;
      room.gameLogs.push(`👑 ${room.players[0].name} es ahora el Anfitrión.`);
    }

    if (room.status === 'PLAYING') {
      this.handlePlayerRemovedTurnReassignment(room, pIndex);
    }

    return { room };
  }

  switchToPlayer(roomCode, socketId, userId) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Sala no encontrada.' };

    if (!room.spectators) room.spectators = [];
    const sIndex = room.spectators.findIndex((s) => s.userId === userId || s.socketId === socketId);
    if (sIndex === -1) return { error: 'No estás en modo espectador.' };

    if (room.players.length >= 6) {
      return { error: 'La mesa está llena (Máximo 6 jugadores).' };
    }

    const spec = room.spectators[sIndex];
    room.spectators.splice(sIndex, 1);

    const newPlayer = {
      userId: spec.userId,
      socketId: socketId,
      name: spec.name,
      avatar: spec.avatar || '🎲',
      isOffline: false,
      wins: 0,
      board: CachoEngine.createEmptyBoard(),
      boardDetails: CachoEngine.createEmptyBoardDetails(),
      totalScore: 0,
    };

    room.players.push(newPlayer);
    room.gameLogs.push(`🎮 ${newPlayer.name} ingresó como jugador activo a la mesa.`);
    return { room };
  }

  disconnectPlayer(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.isOffline = true;
        room.gameLogs.push(`🔌 ${player.name} se desconectó (Offline).`);
        return { roomCode: code, room };
      }
      if (room.spectators) {
        const specIndex = room.spectators.findIndex((s) => s.socketId === socketId);
        if (specIndex !== -1) {
          room.spectators.splice(specIndex, 1);
          return { roomCode: code, room };
        }
      }
    }
    return null;
  }

  leaveRoom(roomCode, socketId, userId) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    if (room.spectators) {
      const specIndex = room.spectators.findIndex((s) => s.userId === userId || s.socketId === socketId);
      if (specIndex !== -1) {
        const spec = room.spectators[specIndex];
        room.spectators.splice(specIndex, 1);
        room.gameLogs.push(`🚪 ${spec.name} abandonó la sala.`);
        return { roomCode, room };
      }
    }

    const pIndex = room.players.findIndex((p) => p.userId === userId || p.socketId === socketId);
    if (pIndex === -1) return null;

    const leavingPlayer = room.players[pIndex];
    room.players.splice(pIndex, 1);
    room.gameLogs.push(`🚪 ${leavingPlayer.name} abandonó la sala.`);

    if (room.players.length === 0 && (!room.spectators || room.spectators.length === 0)) {
      this.rooms.delete(roomCode);
      return { roomCode, room: null };
    }

    if (leavingPlayer.userId === room.hostUserId && room.players.length > 0) {
      room.hostUserId = room.players[0].userId;
      room.gameLogs.push(`👑 ${room.players[0].name} es ahora el Anfitrión.`);
    }

    if (room.status === 'PLAYING') {
      this.handlePlayerRemovedTurnReassignment(room, pIndex);
    }

    return { roomCode, room };
  }

  kickPlayer(roomCode, requesterSocketId, requesterUserId, targetUserId) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Sala no encontrada.' };

    if (room.hostUserId !== requesterUserId) {
      return { error: 'Solo el Anfitrión puede expulsar jugadores.' };
    }

    if (requesterUserId === targetUserId) {
      return { error: 'No puedes expulsarte a ti mismo.' };
    }

    const pIndex = room.players.findIndex((p) => p.userId === targetUserId);
    if (pIndex === -1) return { error: 'Jugador no encontrado.' };

    const kickedPlayer = room.players[pIndex];
    room.players.splice(pIndex, 1);
    room.gameLogs.push(`👢 ${kickedPlayer.name} fue expulsado por el Anfitrión.`);

    if (room.status === 'PLAYING') {
      this.handlePlayerRemovedTurnReassignment(room, pIndex);
    }

    return { room, kickedSocketId: kickedPlayer.socketId };
  }

  handlePlayerRemovedTurnReassignment(room, removedIndex) {
    if (room.players.length < 2) {
      room.status = 'LOBBY';
      room.gameLogs.push('Partida pausada: Se necesitan al menos 2 jugadores activos.');
      return;
    }

    if (room.currentTurnIndex === removedIndex) {
      room.currentTurnIndex = room.currentTurnIndex % room.players.length;
      this.resetTurnState(room);
      const nextPlayer = room.players[room.currentTurnIndex];
      room.gameLogs.push(`⚡ Turno reasignado automáticamente a ${nextPlayer.name}.`);
    } else if (room.currentTurnIndex > removedIndex) {
      room.currentTurnIndex = (room.currentTurnIndex - 1) % room.players.length;
    }
  }

  startGame(roomCode, requesterSocketId, requesterUserId) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Sala no encontrada.' };

    if (room.hostUserId !== requesterUserId) {
      return { error: 'Solo el anfitrión puede iniciar el juego.' };
    }

    if (room.players.length < 2) {
      return { error: 'Se necesitan al menos 2 jugadores activos en la mesa.' };
    }

    room.status = 'PLAYING';
    room.winner = null;
    room.winReason = null;

    room.players.forEach((p) => {
      p.board = CachoEngine.createEmptyBoard();
      p.boardDetails = CachoEngine.createEmptyBoardDetails();
      p.totalScore = 0;
    });

    room.currentTurnIndex = room.startingPlayerIndex % room.players.length;
    this.resetTurnState(room);

    const firstPlayerName = room.players[room.currentTurnIndex].name;
    room.gameLogs.push(`¡Partida iniciada! Comienza lanzando ${firstPlayerName}.`);

    return { room };
  }

  resetTurnState(room) {
    room.turnState = {
      rollsLeft: 3,
      dice: [1, 1, 1, 1, 1],
      keptDice: [false, false, false, false, false],
      isReal: true,
      activeCanto: null,
      hasRolledThisTurn: false,
      cantoFailed: false,
      cantoResolution: null,
    };
  }

  rollDice(roomCode, socketId, calledCantoNumber = null, io = null) {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'PLAYING') return { error: 'Partida no activa.' };

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.socketId !== socketId) return { error: 'No es tu turno.' };
    if (currentPlayer.isOffline) return { error: 'Estás desconectado.' };

    const ts = room.turnState;
    if (ts.cantoResolution?.active) return { error: 'Resolviendo Canto en la mesa...' };
    if (ts.rollsLeft <= 0) return { error: 'No te quedan tiros en este turno.' };

    if (calledCantoNumber !== null) {
      if (typeof calledCantoNumber === 'object' && calledCantoNumber.predictedSum !== undefined) {
        const { predictedSum, targetCategory } = calledCantoNumber;
        if (currentPlayer.board[targetCategory] !== null && currentPlayer.board.grande !== null) {
          return {
            error: `No puedes cantar a ${targetCategory.toUpperCase()} porque tanto esa casilla como La Grande ya están ocupadas.`,
          };
        }
        ts.activeCantoData = { predictedSum: Number(predictedSum), targetCategory };
        ts.activeCanto = targetCategory;
      } else if (typeof calledCantoNumber === 'string') {
        const targetMajor = calledCantoNumber.toLowerCase();
        if (currentPlayer.board[targetMajor] !== null) {
          return {
            error: `No puedes cantar a ${targetMajor.toUpperCase()} porque esa casilla ya está ocupada en tu tablero.`,
          };
        }
        ts.activeCanto = targetMajor;
      } else {
        const targetCategory = Object.keys(require('./CachoEngine').NUMBER_VALUES).find(
          (key) => require('./CachoEngine').NUMBER_VALUES[key] === calledCantoNumber
        );
        const isTargetEmpty = currentPlayer.board[targetCategory] === null;
        const isGrandeEmpty = currentPlayer.board.grande === null;

        if (!isTargetEmpty && !isGrandeEmpty) {
          return {
            error: `No puedes cantar al ${calledCantoNumber} porque tanto la casilla ${targetCategory.toUpperCase()} como La Grande ya están ocupadas.`,
          };
        }
        ts.activeCanto = calledCantoNumber;
      }
    }

    const newDice = [...ts.dice];
    const unkeptRolledDice = [];
    let countKept = 0;
    for (let i = 0; i < 5; i++) {
      if (ts.keptDice[i]) {
        countKept++;
      } else {
        const rolledVal = Math.floor(Math.random() * 6) + 1;
        newDice[i] = rolledVal;
        unkeptRolledDice.push(rolledVal);
      }
    }

    ts.dice = newDice;
    ts.rollsLeft--;
    ts.hasRolledThisTurn = true;

    const throwIsReal = countKept === 0;
    const unkeptCount = 5 - countKept;
    ts.isReal = throwIsReal;

    let logText = `${currentPlayer.name} lanzó los dados [${newDice.join(', ')}]`;
    if (throwIsReal) logText += ' (¡Tiro limpio / 5 dados!)';

    if (ts.activeCantoData || ts.activeCanto !== null) {
      let cantoEval;
      let targetCategory;
      let predictedSum = null;
      let sumUnkept = null;

      if (ts.activeCantoData) {
        predictedSum = ts.activeCantoData.predictedSum;
        targetCategory = ts.activeCantoData.targetCategory;
        logText += ` (Cantando Suma Exacta ${predictedSum} a ${targetCategory.toUpperCase()})`;

        cantoEval = CachoEngine.evaluateExactSumCanto(
          unkeptRolledDice,
          predictedSum,
          targetCategory,
          currentPlayer.board,
          unkeptCount
        );
        sumUnkept = cantoEval.sumUnkept;
      } else if (typeof ts.activeCanto === 'string') {
        const calledTarget = ts.activeCanto;
        logText += ` (Cantando a ${calledTarget.toUpperCase()})`;
        cantoEval = CachoEngine.evaluateMajorCanto(newDice, calledTarget, currentPlayer.board);
        targetCategory = calledTarget;
      } else {
        const calledTarget = ts.activeCanto;
        logText += ` (Cantando al ${calledTarget})`;
        cantoEval = CachoEngine.evaluateCanto(newDice, calledTarget, currentPlayer.board);
        targetCategory = Object.keys(require('./CachoEngine').NUMBER_VALUES).find(
          (key) => require('./CachoEngine').NUMBER_VALUES[key] === calledTarget
        );
      }

      ts.cantoResolution = {
        active: true,
        success: cantoEval.success,
        calledNumber: ts.activeCanto,
        predictedSum,
        sumUnkept,
        categoryToFill: cantoEval.categoryToFill,
        score: cantoEval.score,
        isTuti: cantoEval.isTuti,
        playerName: currentPlayer.name,
        targetCategory,
        message: cantoEval.success
          ? cantoEval.isTuti
            ? `¡ACERTASTE LA SUMA EXACTA DE ${predictedSum}! ¡VICTORIA INSTANTÁNEA POR TUTI!`
            : `¡ACERTASTE EL CANTO AL ${targetCategory.toUpperCase()}! Anotando ${cantoEval.score} pts...`
          : `¡FALLASTE EL CANTO! ${sumUnkept !== null ? `(Suma real: ${sumUnkept}, esperada: ${predictedSum}).` : ''} Se tachará 0...`,
      };

      room.gameLogs.push(logText);

      setTimeout(() => {
        const activeRoom = this.getRoom(roomCode);
        if (!activeRoom || activeRoom.status !== 'PLAYING') return;

        const curPlayer = activeRoom.players[activeRoom.currentTurnIndex];

        if (cantoEval.success) {
          activeRoom.gameLogs.push(
            `${curPlayer.name} acertó el Canto ${predictedSum ? `(Suma ${predictedSum})` : ''} a ${cantoEval.categoryToFill.toUpperCase()}.`
          );
          const catToFill = cantoEval.categoryToFill;
          curPlayer.board[catToFill] = cantoEval.score;
          curPlayer.boardDetails[catToFill] = {
            score: cantoEval.score,
            isReal: activeRoom.turnState.isReal,
            isCrossed: false,
          };
          curPlayer.totalScore = CachoEngine.calculateTotalScore(curPlayer.board);
          activeRoom.turnState.cantoResolution = null;
          activeRoom.turnState.activeCantoData = null;

          if (cantoEval.isTuti || (activeRoom.turnState.isReal && CachoEngine.isGrande(newDice))) {
            this.endGameWithWinner(
              activeRoom,
              curPlayer,
              'TUTI',
              `¡VICTORIA AUTOMÁTICA INSTANTÁNEA (TUTI) AL ACERTAR LA SUMA EXACTA DE ${predictedSum || 50}!`
            );
          } else {
            this.nextTurn(activeRoom);
          }
        } else {
          let categoryToCross;
          if (curPlayer.board[targetCategory] === null) {
            categoryToCross = targetCategory;
          } else if (curPlayer.board.grande === null) {
            categoryToCross = 'grande';
          } else {
            categoryToCross = targetCategory;
          }

          curPlayer.board[categoryToCross] = 0;
          curPlayer.boardDetails[categoryToCross] = {
            score: 0,
            isReal: false,
            isCrossed: true,
          };
          curPlayer.totalScore = CachoEngine.calculateTotalScore(curPlayer.board);
          activeRoom.gameLogs.push(
            `${curPlayer.name} falló el Canto. Se tachó automáticamente 0 (Huevo) en ${categoryToCross.toUpperCase()}.`
          );
          activeRoom.turnState.cantoResolution = null;
          activeRoom.turnState.activeCantoData = null;

          if (this.checkAllBoardsComplete(activeRoom)) {
            this.endGameByPoints(activeRoom);
          } else {
            this.nextTurn(activeRoom);
          }
        }

        if (io) {
          io.to(roomCode.toUpperCase()).emit('room_updated', activeRoom);
        }
      }, 4000);

      return { room };
    }

    if (CachoEngine.isTutiWin(newDice, ts.isReal)) {
      room.gameLogs.push(logText);
      return this.endGameWithWinner(room, currentPlayer, 'TUTI', '¡TUTI INSTANTÁNEO! 5 dados del mismo valor en un tiro.');
    }

    room.gameLogs.push(logText);
    return { room };
  }

  toggleKeepDie(roomCode, socketId, dieIndex) {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'PLAYING') return { error: 'Partida no activa.' };

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.socketId !== socketId) return { error: 'No es tu turno.' };

    const ts = room.turnState;
    if (!ts.hasRolledThisTurn) return { error: 'Debes lanzar primero.' };
    if (ts.rollsLeft <= 0) return { error: 'Ya no tienes más tiros.' };
    if (dieIndex < 0 || dieIndex >= 5) return { error: 'Índice de dado inválido.' };

    ts.keptDice[dieIndex] = !ts.keptDice[dieIndex];
    return { room };
  }

  scoreCategory(roomCode, socketId, category) {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'PLAYING') return { error: 'Partida no activa.' };

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.socketId !== socketId) return { error: 'No es tu turno.' };

    const ts = room.turnState;
    if (!ts.hasRolledThisTurn) return { error: 'Debes lanzar los dados antes de anotar.' };
    if (currentPlayer.board[category] !== null) return { error: 'Esta casilla ya está anotada.' };

    const options = CachoEngine.getScoringOptions(ts.dice, ts.isReal, currentPlayer.board);
    const catOption = options[category];

    if (!catOption || !catOption.canScore) {
      return { error: 'No cumples los requisitos para esta jugada. Si deseas, puedes tacharla (poner huevo).' };
    }

    const scoredPoints = catOption.score;
    currentPlayer.board[category] = scoredPoints;
    currentPlayer.boardDetails[category] = {
      score: scoredPoints,
      isReal: catOption.isReal,
      isCrossed: false,
    };
    currentPlayer.totalScore = CachoEngine.calculateTotalScore(currentPlayer.board);

    room.gameLogs.push(
      `${currentPlayer.name} anotó ${scoredPoints} pts en ${category.toUpperCase()} ${
        catOption.isReal ? '(¡REAL!)' : '(Armada)'
      }.`
    );

    if (CachoEngine.isThreeRealesWin(currentPlayer.boardDetails)) {
      return this.endGameWithWinner(
        room,
        currentPlayer,
        '3_REALES',
        '¡VICTORIA POR LAS 3 REALES! (Escalera Real, Panza Real y Póker Real).'
      );
    }

    if (this.checkAllBoardsComplete(room)) {
      return this.endGameByPoints(room);
    }

    this.nextTurn(room);
    return { room };
  }

  crossCategory(roomCode, socketId, category) {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'PLAYING') return { error: 'Partida no activa.' };

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.socketId !== socketId) return { error: 'No es tu turno.' };

    const ts = room.turnState;
    if (!ts.hasRolledThisTurn) return { error: 'Debes lanzar los dados antes de tachar.' };
    if (currentPlayer.board[category] !== null) return { error: 'Esta casilla ya está ocupada.' };

    currentPlayer.board[category] = 0;
    currentPlayer.boardDetails[category] = {
      score: 0,
      isReal: false,
      isCrossed: true,
    };
    currentPlayer.totalScore = CachoEngine.calculateTotalScore(currentPlayer.board);

    room.gameLogs.push(`${currentPlayer.name} tachó 0 (Huevo) en ${category.toUpperCase()}.`);

    if (this.checkAllBoardsComplete(room)) {
      return this.endGameByPoints(room);
    }

    this.nextTurn(room);
    return { room };
  }

  nextTurn(room) {
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
    this.resetTurnState(room);
    const nextPlayer = room.players[room.currentTurnIndex];
    room.gameLogs.push(`Turno de ${nextPlayer.name}.`);
  }

  checkAllBoardsComplete(room) {
    return room.players.every((p) => CachoEngine.isBoardComplete(p.board));
  }

  endGameWithWinner(room, winnerPlayer, winReason, logMessage) {
    room.status = 'GAME_OVER';
    room.winner = winnerPlayer;
    room.winReason = winReason;
    winnerPlayer.wins += 1;
    room.gameLogs.push(logMessage);
    return { room };
  }

  endGameByPoints(room) {
    room.status = 'GAME_OVER';
    room.winReason = 'POINTS';

    let maxScore = -1;
    let winner = null;
    room.players.forEach((p) => {
      if (p.totalScore > maxScore) {
        maxScore = p.totalScore;
        winner = p;
      }
    });

    room.winner = winner;
    if (winner) winner.wins += 1;

    room.gameLogs.push(`¡Partida terminada por puntos! Ganador: ${winner.name} con ${winner.totalScore} pts.`);
    return { room };
  }

  rematchGame(roomCode, requesterSocketId, requesterUserId) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Sala no encontrada.' };

    room.startingPlayerIndex = (room.startingPlayerIndex + 1) % room.players.length;
    room.gameRound += 1;

    room.status = 'PLAYING';
    room.winner = null;
    room.winReason = null;

    room.players.forEach((p) => {
      p.board = CachoEngine.createEmptyBoard();
      p.boardDetails = CachoEngine.createEmptyBoardDetails();
      p.totalScore = 0;
    });

    room.currentTurnIndex = room.startingPlayerIndex % room.players.length;
    this.resetTurnState(room);

    const starter = room.players[room.currentTurnIndex];
    room.gameLogs.push(
      `--- Partida ${room.gameRound} iniciada --- Rota el saque: Inicia ${starter.name}.`
    );

    return { room };
  }
}

module.exports = new RoomManager();
