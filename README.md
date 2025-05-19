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
- 🔄 Webhook and polling support
- 🔐 Built-in JWT authentication
- 🎯 Middleware support
- 📝 Type-safe development

## 📋 Prerequisites

- Node.js (v14 or higher)
- Redis
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## 🛠️ Installation

```bash
npm install @wasserstoff/mangi-tg-bot
```

## 📖 Usage Examples

### Basic Bot Setup with Updated BotManager

```typescript
import { Bot, AppConfig } from '@wasserstoff/mangi-tg-bot';
import { CustomContext } from '@wasserstoff/mangi-tg-bot/bot/context/CustomContext';

const config: AppConfig = {
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

---

## 🗃️ Session Management (CRUD Helpers)

The SDK provides easy CRUD helpers for managing session variables in `ctx.session.custom`.

### **Session CRUD API**

- `ctx.session.setCustom(key, value)` — Set a variable in `session.custom`
- `ctx.session.getCustom(key)` — Get a variable from `session.custom`
- `ctx.session.updateCustom({ ... })` — Update multiple variables in `session.custom`
- `ctx.session.deleteCustom(key)` — Delete a variable from `session.custom`
- `ctx.session.save(callback)` — Persist the session to Redis immediately (optional, usually auto-saved)

#### **Example Usage in a Command Handler**

```typescript
botManager.handleCommand('setvar', async (ctx: CustomContext) => {
  // Set a variable
  ctx.session.setCustom('foo', 'bar');
  // Get a variable
  const foo = ctx.session.getCustom('foo');
  // Update multiple variables
  ctx.session.updateCustom({ hello: 'world', count: 1 });
  // Delete a variable
  ctx.session.deleteCustom('count');
  // Save session if available (optional)
  if (typeof ctx.session.save === 'function') {
    ctx.session.save(() => {});
  }
  await ctx.reply(`Session custom variable 'foo' set to '${foo}'. Updated and deleted 'count'.`);
});
```

---

## 🏗️ Project Structure

```
├── bot/
│   ├── features/           # Bot features and command handlers
│   ├── middlewares/        # Custom middlewares
│   ├── context/            # Custom context definitions
│   ├── BotManager.ts       # Main bot management class (updated API)
│   └── BotClient.ts        # New Telegram Client API for managing sessions
├── database/               # Database connections (only Redis required)
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

# Redis Configuration
REDIS_URL=redis://localhost:6379

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
