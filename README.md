# @wasserstoff/mangi-tg-bot SDK

A powerful and flexible Telegram Bot SDK built with TypeScript. This release introduces an updated BotManager API for more granular handling of commands, messages, and callback queries, as well as a new BotClient module for direct Telegram client interactions and session management.

## 🚀 Features

- 🛠️ **Updated BotManager API**
  - **Commands:** Use `handleCommand` and `handleCommandWithAuth` to register commands with custom callback handlers.
  - **Message Handling:** Use `handleMessage` and `handleMessageWithAuth` with a filter callback of type `(ctx: CustomContext) => boolean` for precise control over which messages to process.
  - **Callback Queries:** Use `handleCallback` and `handleCallbackWithAuth` with a filter callback to process specific callback queries.
- 📱 **New BotClient Module:**
  - Provides a Telegram client API enabling developers to manage their own sessions and directly interact with Telegram.
- 💾 Redis session management
- 🗄️ MongoDB integration
- 🔄 Webhook and polling support
- 🔐 Built-in JWT authentication
- 🎯 Middleware support
- 📝 Type-safe development

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## 🛠️ Installation

```bash
npm install @wasserstoff/mangi-tg-bot
```

## 📖 Updated Usage Examples

### Basic Bot Setup with Updated BotManager

The following example demonstrates how to set up a basic bot using the updated BotManager. Notice that instead of using simple strings or regex patterns for filtering messages and callbacks, you now provide a callback function that receives the full context (`ctx`).

```typescript
import { Bot, AppConfig } from '@wasserstoff/mangi-tg-bot';
import { CustomContext } from '@wasserstoff/mangi-tg-bot/bot/context/CustomContext';

const config: AppConfig = {
    mongodbUri: 'mongodb://localhost:27017/mangi-tg-bot',
    botToken: 'YOUR_BOT_TOKEN',
    botMode: 'polling',
    botAllowedUpdates: ['message', 'callback_query'],
    redisUrl: 'redis://localhost:6379',
    isDev: true,
    useAuth: 'none'
};

async function main() {
    const bot = new Bot(config);
    const botManager = bot.getBotManager();

    // Register a simple command using handleCommand
    botManager.handleCommand('start', async (ctx: CustomContext) => {
        await ctx.reply('Welcome to the bot! 👋');
    });

    // Register a secure command (requires jwtSecret in config)
    botManager.handleCommandWithAuth('secure', async (ctx: CustomContext) => {
        await ctx.reply('This secure command requires authentication.');
    });

    // Handle messages: process only messages containing "hello"
    botManager.handleMessage(
        (ctx: CustomContext) => (ctx.message?.text || '').toLowerCase().includes('hello'),
        async (ctx: CustomContext) => {
            await ctx.reply('Hello! How can I assist you?');
        }
    );

    // Handle callback queries: process only callbacks with "info" in their data
    botManager.handleCallback(
        (ctx: CustomContext) => (ctx.callbackQuery?.data || '').includes('info'),
        async (ctx: CustomContext) => {
            await ctx.reply('Callback query info processed.');
        }
    );

    await bot.initialize();
}

main().catch(console.error);
```

### Authentication Setup Example

#### Full Authentication (Automatic)
When `useAuth` is set to "fully" in your configuration along with a valid `jwtSecret`, the SDK automatically applies authentication to all routes. In this mode, you can register commands, message handlers, and callback queries using the standard methods (`handleCommand`, `handleMessage`, and `handleCallback`); these routes will be secured automatically.

**Example:**
```typescript
import { Bot, AppConfig } from '@wasserstoff/mangi-tg-bot';
import { CustomContext } from '@wasserstoff/mangi-tg-bot/bot/context/CustomContext';

const configWithAuth: AppConfig = {
    mongodbUri: 'mongodb://localhost:27017/mangi-tg-bot',
    botToken: 'YOUR_BOT_TOKEN',
    botMode: 'polling',
    botAllowedUpdates: ['message', 'callback_query'],
    redisUrl: 'redis://localhost:6379',
    isDev: true,
    useAuth: 'fully',
    jwtSecret: 'your-secret-key'
};

async function createFullyAuthenticatedBot() {
    const bot = new Bot(configWithAuth);
    const botManager = bot.getBotManager();

    // Standard methods automatically secured with authentication
    botManager.handleCommand('start', async (ctx: CustomContext) => {
        await ctx.reply('Welcome to the fully authenticated bot!');
    });

    botManager.handleMessage(
        (ctx: CustomContext) => (ctx.message?.text || '').toLowerCase().includes('secure'),
        async (ctx: CustomContext) => {
            await ctx.reply('This message handler is secured via full authentication!');
        }
    );

    await bot.initialize();
}

createFullyAuthenticatedBot().catch(console.error);
```

#### Partial Authentication (Selective)
If you prefer to apply authentication only to specific routes rather than across the entire bot, set `useAuth` to "partially" and use the specialized methods (`handleCommandWithAuth`, `handleMessageWithAuth`, and `handleCallbackWithAuth`) to secure only selected routes.

**Example:**
```typescript
import { Bot, AppConfig } from '@wasserstoff/mangi-tg-bot';
import { CustomContext } from '@wasserstoff/mangi-tg-bot/bot/context/CustomContext';

const configPartialAuth: AppConfig = {
    mongodbUri: 'mongodb://localhost:27017/mangi-tg-bot',
    botToken: 'YOUR_BOT_TOKEN',
    botMode: 'polling',
    botAllowedUpdates: ['message', 'callback_query'],
    redisUrl: 'redis://localhost:6379',
    isDev: true,
    useAuth: 'partially',
    jwtSecret: 'your-secret-key'
};

async function createPartiallyAuthenticatedBot() {
    const bot = new Bot(configPartialAuth);
    const botManager = bot.getBotManager();

    // Use specialized methods to secure selected routes
    botManager.handleCommandWithAuth('secure', async (ctx: CustomContext) => {
        await ctx.reply('This secure command requires authentication.');
    });

    botManager.handleMessageWithAuth(
        (ctx: CustomContext) => (ctx.message?.text || '').toLowerCase().includes('secure'),
        async (ctx: CustomContext) => {
            await ctx.reply('This message handler is selectively secured!');
        }
    );

    await bot.initialize();
}

createPartiallyAuthenticatedBot().catch(console.error);
```

### Telegram Client API with BotClient

The new `BotClient` module lets you interact directly with the Telegram client API. This is ideal for developers who want to manage their own sessions or need lower-level access to Telegram.

```typescript
import { TelegramManager } from '@wasserstoff/mangi-tg-bot';

async function clientDemo() {

    export const apiId = 203; // Replace with your actual API ID.
    export const apiHash = "248e85787b42c...."; // Replace with your actual API Hash.

    // Initialize the Telegram Client with your bot token and custom session configuration
    const client = new TelegramManager(apiId, apiHash, sessionData);

    // Connect the client to Telegram with session
    await client.connect();

    // Login without session 
    await client.start("+91 88-----")

    await client.createGroup(["username1", "username2"], "My New Group");
    
    await client.createChannel("My New Channel", "This channel is created programmatically using GramJS");
    
}

clientDemo().catch(console.error);
```

## 🏗️ Project Structure

```
├── bot/
│   ├── features/           # Bot features and command handlers
│   ├── middlewares/        # Custom middlewares
│   ├── context/            # Custom context definitions
│   ├── BotManager.ts       # Main bot management class (updated API)
│   └── BotClient.ts        # New Telegram Client API for managing sessions
├── database/               # Database connections
├── config.ts               # Configuration management
└── index.ts                # Main entry point
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Bot Configuration
NODE_ENV=development
LOG_LEVEL=debug
BOT_TOKEN=your_bot_token_here
BOT_USERNAME=your_bot_username
BOT_MODE=polling
BOT_ALLOWED_UPDATES=["message","callback_query"]

# Database Configuration
REDIS_URL=redis://localhost:6379
MONGO_URL=mongodb://localhost:27017/tg-bot

# Authentication Configuration
USE_AUTH=true
JWT_SECRET=your-secret-key-here

# Optional Webhook Configuration
# BOT_WEBHOOK_URL=https://your-domain.com/webhook
# HTTP_SERVER_HOST=0.0.0.0
# HTTP_SERVER_PORT=3000
```

## 📦 Docker Support

The package includes Docker and docker-compose configurations for easy deployment:

```bash
# Start with docker-compose
docker-compose up -d
```

## 📄 License

ISC

## 📚 GitHub Repository

This project is available on GitHub:
[https://github.com/AmanUpadhyay1609/-wasserstoff-mangi-tg-bot](https://github.com/AmanUpadhyay1609/-wasserstoff-mangi-tg-bot)

Issues, feature requests, and contributions are welcome!
