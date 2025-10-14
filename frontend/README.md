# Rocket Betting Frontend

A Next.js frontend for the rocket betting game with real-time WebSocket integration.

## Features

- **Real-time Betting**: Place bets, set auto-cashout, and cashout manually
- **Live Game State**: Real-time countdown, multiplier updates, and game events
- **User Management**: Wallet-based authentication with balance tracking
- **Responsive UI**: Modern betting interface with live player list

## Integration with Backend

The frontend connects to the backend via WebSocket for real-time updates:

### WebSocket Events

#### Client → Server
- `placeBet` - Place a bet with amount and optional auto-cashout
- `cashout` - Cashout an active bet

#### Server → Client
- `gameState` - Initial game state on connection
- `gameUpdate` - Real-time game updates (countdown, multiplier, etc.)
- `betResult` - Result of bet placement
- `cashoutResult` - Result of cashout operation

### Environment Configuration

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Components

### CenterGame
Main betting interface with:
- Bet amount input with quick bet buttons (1/2, 2x, MAX)
- Auto-cashout setting
- Place bet / Cashout button
- Live player list with real-time updates
- Connection status and user balance

### RocketEffect
Rocket animation component that:
- Receives game state from betting system
- Shows countdown timer (20s initial + 20s between games)
- Displays real-time multiplier updates
- Triggers blast effects on game completion
- Shows target multiplier and current multiplier

### useBetting Hook
Custom hook that manages:
- WebSocket connection to backend
- Game state synchronization
- Bet placement and cashout operations
- User authentication and balance
- Real-time updates and error handling

## Game Flow

1. **Connection**: Frontend connects to backend WebSocket
2. **Initial Countdown**: 20-second countdown before first game
3. **Betting Phase**: Players place bets during countdown
4. **Game Start**: Rocket animation begins with real-time multiplier
5. **Auto-cashout**: Automatic cashout when target reached
6. **Manual Cashout**: Players can cashout during game
7. **Game End**: Blast effects, process results, start next countdown

## Usage

1. Start the backend server: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open http://localhost:3000
4. Connect wallet (demo mode available)
5. Place bets and watch the rocket!

## Demo Mode

The frontend includes demo mode for testing without wallet connection. Replace the demo user logic in `CenterGame.tsx` with actual wallet integration.

## Key Features

- **Real-time Updates**: All game state synchronized via WebSocket
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Comprehensive error messages and validation
- **Balance Management**: Real-time balance updates
- **Bet History**: Track user's betting history
- **Auto-cashout**: Set automatic cashout multipliers
- **Live Players**: See all active players and their bets