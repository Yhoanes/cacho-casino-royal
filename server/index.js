/**
 * server/index.js
 * Main server entrypoint for Express & Socket.io deployment.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const setupSocketHandlers = require('./game/socketHandlers');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Initialize Socket.io with flexible CORS for dev & production
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for seamless Socket.io connections on Render
    methods: ['GET', 'POST'],
  },
});

// Setup game socket handlers
setupSocketHandlers(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', game: 'Cacho Boliviano', timestamp: new Date().toISOString() });
});

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🎲 Cacho Boliviano Server running on PORT: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===================================================`);
});
