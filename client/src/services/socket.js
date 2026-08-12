/**
 * socket.js
 * Socket.io client setup for real-time state synchronization
 */

import { io } from 'socket.io-client';

// In production, socket connects to current window origin; in dev, connects to VITE_SERVER_URL or localhost:3001
const URL = import.meta.env.PROD ? undefined : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3001');

export const socket = io(URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});
