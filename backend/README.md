# SOLPUMP Backend 🚀

A real-time betting backend system for the SOLPUMP rocket crash game using Supabase and WebSocket.

## 🎯 Features

- **Real-time Game State**: WebSocket-based updates for countdown, multiplier changes, and game events
- **Betting System**: Place bets, auto-cashout, and manual cashout functionality
- **User Management**: Wallet-based authentication with balance tracking
- **Supabase Integration**: Uses Supabase JS Client exclusively (no direct PostgreSQL connections)
- **Game Logic**: Synchronized timing with frontend RocketEffect component

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file based on the template in `ENV.md`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=https://rohglryiaxxcobugmpik.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Game Configuration
INITIAL_BALANCE=1000
AIRDROP_AMOUNT=0.06
```

**⚠️ Important**: Do NOT include `SUPABASE_DB_URL`. We use Supabase JS Client only.

### 3. Set Up Database

Run the migration script in your Supabase SQL Editor:

```bash
# Copy the contents of migration.sql and run it in Supabase SQL Editor
# Or use the Supabase CLI:
supabase db push
```

See `MIGRATION_GUIDE.md` for detailed instructions.

### 4. Start Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
npm start
```

## 📡 API Endpoints

### REST API

#### Users
- `GET /api/users` - List recent users
- `POST /api/users` - Login/signup user
- `GET /api/users/:address` - Get user by wallet address
- `PUT /api/users/:address/balance` - Update user balance

#### Betting
- `GET /api/betting/game-state` - Get current game state (use WebSocket for real-time)
- `POST /api/betting/place-bet` - Place a bet
- `POST /api/betting/cashout` - Cashout a bet
- `GET /api/betting/user-bets/:address` - Get user's betting history
- `GET /api/betting/active-bets` - Get all active bets for current game
- `GET /api/betting/recent-games` - Get recent game results

#### Airdrop
- `GET /api/airdrop` - Get airdrop information

### WebSocket Events

#### Client → Server
- `placeBet` - Place a bet
  ```typescript
  socket.emit('placeBet', {
    user_address: 'wallet_address',
    amount: 10.0,
    auto_cashout: 2.5 // optional
  });
  ```

- `cashout` - Cashout a bet
  ```typescript
  socket.emit('cashout', {
    user_address: 'wallet_address',
    bet_id: 'bet_uuid'
  });
  ```

- `getGameState` - Request current game state
  ```typescript
  socket.emit('getGameState');
  ```

#### Server → Client
- `gameState` - Initial game state on connection
- `gameStateResponse` - Response to getGameState request
- `gameUpdate` - Real-time game updates
  - Types: `COUNTDOWN`, `GAME_START`, `MULTIPLIER_UPDATE`, `GAME_END`, `BET_PLACED`, `BET_CASHED_OUT`
- `betResult` - Bet placement result
- `cashoutResult` - Cashout result

## 🎮 Game Flow

1. **Initial Countdown**: 20-second countdown before first game
2. **Betting Phase**: Players can place bets during countdown
3. **Game Start**: Rocket animation begins with 3-second delay at 1.00×
4. **Multiplier Updates**: Real-time multiplier updates at 0.1×/second (fixed speed)
5. **Auto-cashout**: Automatic cashout when target multiplier reached
6. **Game End**: Process remaining bets, start 20-second countdown for next game

## 📊 Database Schema

### Users Table
```sql
id              uuid primary key
address         text unique not null
name            text not null
email           text not null
balance         numeric not null default 1000
created_at      timestamptz default now()
updated_at      timestamptz default now()
```

### Games Table
```sql
id                  uuid primary key
target_multiplier   numeric not null
current_multiplier  numeric not null default 1.0
status              text check (status in ('COUNTDOWN', 'RUNNING', 'COMPLETED', 'CANCELLED'))
start_time          timestamptz
end_time            timestamptz
final_multiplier    numeric
created_at          timestamptz default now()
updated_at          timestamptz default now()
```

### Bets Table
```sql
id                      uuid primary key
user_id                 uuid references users(id)
user_address            text not null
user_name               text not null
amount                  numeric not null check (amount > 0)
auto_cashout            numeric
game_id                 uuid references games(id)
status                  text check (status in ('PENDING', 'ACTIVE', 'CASHED_OUT', 'LOST', 'WON'))
multiplier_at_cashout   numeric
payout                  numeric
created_at              timestamptz default now()
updated_at              timestamptz default now()
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Required |
| `INITIAL_BALANCE` | Starting balance for new users | `1000` |
| `AIRDROP_AMOUNT` | Airdrop display amount | `0.06` |

### Game Parameters

- **Initial Countdown**: 20 seconds
- **Between Games**: 20 seconds
- **Rocket Delay**: 3 seconds at 1.00×
- **Multiplier Speed**: 0.1× per second (fixed)
- **Target Range**: 1.00× to 7.00× (random)

## 🔌 Frontend Integration

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Listen for game updates
socket.on('gameUpdate', (update) => {
  console.log('Game update:', update);
  
  switch (update.type) {
    case 'COUNTDOWN':
      // Update countdown display
      console.log('Countdown:', update.data.countdown);
      break;
      
    case 'GAME_START':
      // Start rocket animation
      console.log('Game started:', update.data);
      break;
      
    case 'MULTIPLIER_UPDATE':
      // Update multiplier display
      console.log('Multiplier:', update.data.multiplier);
      break;
      
    case 'GAME_END':
      // Handle game end
      console.log('Game ended:', update.data.finalMultiplier);
      break;
      
    case 'BET_PLACED':
      // Update bet list
      console.log('Bet placed:', update.data.bet);
      break;
      
    case 'BET_CASHED_OUT':
      // Update bet status
      console.log('Bet cashed out:', update.data);
      break;
  }
});

// Get initial game state
socket.on('gameState', (state) => {
  console.log('Initial game state:', state);
});

// Place a bet
socket.emit('placeBet', {
  user_address: 'wallet_address',
  amount: 10.0,
  auto_cashout: 2.5 // optional
});

// Listen for bet result
socket.on('betResult', (result) => {
  if (result.success) {
    console.log('Bet placed successfully:', result.betId);
  } else {
    console.error('Bet failed:', result.error);
  }
});

// Cashout a bet
socket.emit('cashout', {
  user_address: 'wallet_address',
  bet_id: 'bet_uuid'
});

// Listen for cashout result
socket.on('cashoutResult', (result) => {
  if (result.success) {
    console.log('Cashed out:', result.payout, 'at', result.multiplier);
  } else {
    console.error('Cashout failed:', result.error);
  }
});
```

## 🔒 Security

- **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` on the frontend
- **Backend Only**: This key should only be used in the backend
- **Row Level Security**: Consider enabling RLS policies in Supabase for additional security
- **Environment Variables**: Never commit `.env` files to version control

## 📚 Documentation

- `ENV.md` - Environment variables template
- `MIGRATION_GUIDE.md` - Detailed migration guide from pg to Supabase
- `migration.sql` - Database schema migration script

## 🐛 Troubleshooting

### Database Connection Issues

If you see "relation 'public.users' does not exist":
1. Run the `migration.sql` script in Supabase SQL Editor
2. Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

### WebSocket Connection Failed

1. Check CORS settings in `index.ts`
2. Verify `FRONTEND_URL` environment variable
3. Ensure backend is running on the correct port

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🚢 Deployment

### Vercel/Railway/Render

1. Set environment variables in your hosting platform
2. Deploy the built application
3. Ensure WebSocket support is enabled

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the contribution guidelines first.

---

Built with ❤️ using Node.js, Express, Socket.IO, and Supabase
