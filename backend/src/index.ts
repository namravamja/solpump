import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { usersRouter } from "./routes/users.js";
import { bettingRouter } from "./routes/betting.js";
import { ensureUsersTable } from "./services/db.js";
import { airdropRouter } from "./routes/airdrop.js";
import { GameService } from "./services/gameService.js";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
  },
});
const PORT = process.env.PORT || 5000;

// Initialize game service
const gameService = new GameService();

// CORS middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
  })
);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "EduSphere Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/betting', bettingRouter);
app.use('/api/airdrop', airdropRouter);

// WebSocket connection handling
io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);

  // Send initial game state
  gameService.getGameState().then(state => {
    console.log('🎮 Sending initial game state to client:', state);
    socket.emit('gameState', state);
  });

  // Handle bet placement
  socket.on('placeBet', async (data: any) => {
    try {
      const result = await gameService.placeBet(data.user_address, data.amount, data.auto_cashout);
      socket.emit('betResult', result);
    } catch (error) {
      socket.emit('betResult', { success: false, error: 'Failed to place bet' });
    }
  });

  // Handle cashout
  socket.on('cashout', async (data: any) => {
    try {
      const result = await gameService.cashoutBet(data.user_address, data.bet_id);
      socket.emit('cashoutResult', result);
    } catch (error) {
      socket.emit('cashoutResult', { success: false, error: 'Failed to cashout' });
    }
  });

  // Handle getGameState request
  socket.on('getGameState', async () => {
    try {
      const state = await gameService.getGameState();
      console.log('🎮 Sending game state response to client:', state);
      socket.emit('gameStateResponse', state);
    } catch (error) {
      console.error('Failed to get game state:', error);
    }
  });

  // Handle user login
  socket.on('login', async (data: any) => {
    try {
      console.log('User login attempt:', data);
      // User login is handled by the betting system
      // Just acknowledge the login
      socket.emit('loginResult', { success: true });
    } catch (error) {
      console.error('Login error:', error);
      socket.emit('loginResult', { success: false, error: 'Login failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Set up game service to broadcast updates
gameService.setGameUpdateCallback((update) => {
  io.emit('gameUpdate', update);
});

// Start server
const startServer = async () => {
  try {
    await ensureUsersTable();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🎮 WebSocket server running`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

startServer();

export default app;
