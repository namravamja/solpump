# Rocket Betting Backend

A backend system for the rocket betting game with real-time WebSocket updates.

## Features

- **Real-time Game State**: WebSocket-based updates for countdown, multiplier changes, and game events
- **Betting System**: Place bets, auto-cashout, and manual cashout functionality
- **User Management**: Wallet-based authentication with balance tracking
- **Game Logic**: Matches the frontend RocketEffect.tsx timing and multiplier system

## API Endpoints

### REST API

- `GET /api/betting/game-state` - Get current game state (use WebSocket for real-time)
- `POST /api/betting/place-bet` - Place a bet
- `POST /api/betting/cashout` - Cashout a bet
- `GET /api/betting/user-bets/:address` - Get user's betting history
- `GET /api/betting/active-bets` - Get all active bets for current game
- `GET /api/betting/recent-games` - Get recent game results

### WebSocket Events

#### Client → Server
- `placeBet` - Place a bet
- `cashout` - Cashout a bet

#### Server → Client
- `gameState` - Initial game state
- `gameUpdate` - Real-time game updates
- `betResult` - Bet placement result
- `cashoutResult` - Cashout result

## Game Flow

1. **Initial Countdown**: 20-second countdown before first game
2. **Betting Phase**: Players can place bets during countdown
3. **Game Start**: Rocket animation begins with 3-second delay at 1.00×
4. **Multiplier Updates**: Real-time multiplier updates at 0.1×/second
5. **Auto-cashout**: Automatic cashout when target multiplier reached
6. **Game End**: Process remaining bets, start 20-second countdown for next game

## Database Schema

### Games Table
- `id` - UUID primary key
- `target_multiplier` - Random target (1-24×)
- `current_multiplier` - Current multiplier during game
- `status` - COUNTDOWN, RUNNING, COMPLETED, CANCELLED
- `start_time`, `end_time` - Game timing
- `final_multiplier` - Final result

### Bets Table
- `id` - UUID primary key
- `user_id` - Reference to users table
- `user_address` - Wallet address
- `user_name` - Display name
- `amount` - Bet amount
- `auto_cashout` - Optional auto-cashout multiplier
- `game_id` - Reference to games table
- `status` - PENDING, ACTIVE, CASHED_OUT, LOST, WON
- `multiplier_at_cashout` - Multiplier when cashed out
- `payout` - Final payout amount

## Environment Variables

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=your_database_url
INITIAL_BALANCE=1000
FRONTEND_URL=http://localhost:3000
PORT=5000
```

## Installation

```bash
npm install
npm run dev
```

## Frontend Integration

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Listen for game updates
socket.on('gameUpdate', (update) => {
  switch (update.type) {
    case 'COUNTDOWN':
      // Update countdown display
      break;
    case 'GAME_START':
      // Start rocket animation
      break;
    case 'MULTIPLIER_UPDATE':
      // Update multiplier display
      break;
    case 'GAME_END':
      // Handle game end
      break;
  }
});

// Place a bet
socket.emit('placeBet', {
  user_address: 'wallet_address',
  amount: 10.0,
  auto_cashout: 2.5 // optional
});

// Cashout a bet
socket.emit('cashout', {
  user_address: 'wallet_address',
  bet_id: 'bet_uuid'
});
```

## Game Timing

- **Initial Countdown**: 20 seconds
- **Between Games**: 20 seconds
- **Rocket Delay**: 3 seconds at 1.00×
- **Multiplier Speed**: 0.1× per second
- **Target Range**: 1.00× to 24.00× (random)
- **Rocket Stops**: At 5.5× (visual only, game continues to target)