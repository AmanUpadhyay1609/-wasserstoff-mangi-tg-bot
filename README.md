# @wasserstoff/mangi-tg-bot SDK

A powerful, flexible, and modern Telegram Bot SDK built with TypeScript. This SDK provides:
- **JWT authentication** (fully or partially enforced)
- **Admin approval/authentication** (for public or semi-public bots)
- **Full session management** (CRUD helpers for custom variables)
- **Easy integration with Redis for session and approval state**
- **Modern, type-safe API and middleware support**
- **Professional Logging System** (development and production-ready)

## 🚀 Features

- 🛡️ **JWT Authentication**: Secure your bot with JWT tokens. Enforce authentication on all routes (`fully`) or only on selected routes (`partially`).
- 👥 **Admin Approval Layer**: Add an extra layer of admin approval for new users. Great for public or semi-public bots, clubs, or organizations.
- 🗃️ **Session CRUD Helpers**: Easily manage custom session variables for each user, with built-in helpers for set/get/update/delete.
- 💾 **Redis-backed Session & Approval**: All session and approval state is stored in Redis for performance and reliability.
- 📝 **Type-safe, Modern API**: Built with TypeScript, with clear types and extensibility.
- 📝 **Professional Logging System**:
  - Colorized, detailed logs in development
  - Optimized, minimal logs in production
  - Automatic context logging
  - Multiple log levels (debug, info, warn, error)
  - Timestamp and request tracking
  - Built with Pino for performance

## 📋 Prerequisites

- Node.js (v14 or higher)
- Redis
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## 🛠️ Installation

```bash
npm install @wasserstoff/mangi-tg-bot
```

## 📖 Usage Examples

### 1. Basic Bot with JWT Authentication

```typescript
import { Bot, AppConfig, CustomContext, logger } from '@wasserstoff/mangi-tg-bot';

const configWithJwtAuth: AppConfig = {
  botToken: 'YOUR_BOT_TOKEN',
  botMode: 'polling',
  botAllowedUpdates: ['message', 'callback_query'],
  redisUrl: 'YOUR_REDIS_URL',
  isDev: true,
  useAuth: 'fully', // All routes require JWT authentication
  jwtSecret: 'your_jwt_secret_here',
};

async function createJwtAuthBot() {
  logger.info('Starting bot with JWT authentication:', configWithJwtAuth);
  const bot = new Bot(configWithJwtAuth);
  await bot.initialize();
  const botManager = bot.getBotManager();

  botManager.handleCommand('start', async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      'Welcome! You are authenticated with JWT.'
    );
  });

  botManager.handleCommand('whoami', async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Your chat ID: <code>${ctx.from.id}</code>`,
      { parse_mode: 'HTML' }
    );
  });
}

createJwtAuthBot().catch(console.error);
```

### 2. Bot with Admin Authentication/Approval

```typescript
import { Bot, AppConfig, CustomContext, logger } from '@wasserstoff/mangi-tg-bot';

const configWithAdminAuth: AppConfig = {
  botToken: 'YOUR_BOT_TOKEN',
  botMode: 'polling',
  botAllowedUpdates: ['message', 'callback_query'],
  redisUrl: 'YOUR_REDIS_URL',
  isDev: true,
  useAuth: 'none',
  adminAuthentication: true, // Enable admin approval system
  adminChatIds: [123456789, 987654321], // Replace with your admin Telegram chat IDs
};

async function createAdminAuthBot() {
  logger.info('Starting bot with admin authentication:', configWithAdminAuth);
  const bot = new Bot(configWithAdminAuth);
  await bot.initialize();
  const botManager = bot.getBotManager();

  botManager.handleCommand('start', async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      'Welcome! If you see this, you are approved by an admin.'
    );
  });

  botManager.handleCommand('whoami', async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Your chat ID: <code>${ctx.from.id}</code>`,
      { parse_mode: 'HTML' }
    );
  });

  botManager.handleCommand('secret', async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      'This is a secret command only for approved users!'
    );
  });
}

createAdminAuthBot().catch(console.error);
```

### 3. Bot with Session CRUD Operations

```typescript
import { Bot, AppConfig, CustomContext, logger } from '@wasserstoff/mangi-tg-bot';

const configWithSessionCrud: AppConfig = {
  botToken: 'YOUR_BOT_TOKEN',
  botMode: 'polling',
  botAllowedUpdates: ['message', 'callback_query'],
  redisUrl: 'YOUR_REDIS_URL',
  isDev: true,
  useAuth: 'none',
};

async function createSessionCrudBot() {
  logger.info('Starting bot with session CRUD example:', configWithSessionCrud);
  const bot = new Bot(configWithSessionCrud);
  await bot.initialize();
  const botManager = bot.getBotManager();

  botManager.handleCommand('setvar', async (ctx: CustomContext) => {
    ctx.session.setCustom('foo', 'bar');
    const foo = ctx.session.getCustom('foo');
    ctx.session.updateCustom({ hello: 'world', count: 1 });
    ctx.session.deleteCustom('count');
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Session custom variable 'foo' set to '${foo}'. Updated and deleted 'count'.`
    );
  });

  botManager.handleCommand('getvar', async (ctx: CustomContext) => {
    const foo = ctx.session.getCustom('foo');
    await ctx.api.sendMessage(ctx.chat.id, `Current value of 'foo': ${foo}`);
  });
}

createSessionCrudBot().catch(console.error);
```

### 4. Combined Example: JWT Auth + Admin Auth + Session CRUD

```typescript
import { Bot, AppConfig, CustomContext, logger } from '@wasserstoff/mangi-tg-bot';

const configCombined: AppConfig = {
  botToken: 'YOUR_BOT_TOKEN',
  botMode: 'polling',
  botAllowedUpdates: ['message', 'callback_query'],
  redisUrl: 'YOUR_REDIS_URL',
  isDev: true,
  useAuth: 'fully', // JWT auth required for all routes
  jwtSecret: 'your_jwt_secret_here',
  adminAuthentication: true, // Enable admin approval system
  adminChatIds: [123456789], // Replace with your admin Telegram chat IDs
};

async function createCombinedBot() {
  logger.info(
    'Starting combined bot with JWT, admin auth, and session CRUD:',
    configCombined
  );
  const bot = new Bot(configCombined);
  await bot.initialize();
  const botManager = bot.getBotManager();

  // Set up command menu
  botManager.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'whoami', description: 'Get your chat ID' },
    { command: 'setvar', description: 'Set session variables' },
  ]);

  // Only accessible if JWT is valid AND user is approved by admin
  botManager.handleCommand('start', async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      'Welcome! You are authenticated and approved by an admin.'
    );
  });

  // Session CRUD helpers
  botManager.handleCommand('setvar', async (ctx: CustomContext) => {
    ctx.session.setCustom('foo', 'bar');
    const foo = ctx.session.getCustom('foo');
    ctx.session.updateCustom({ hello: 'world', count: 1 });
    ctx.session.deleteCustom('count');
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Session custom variable 'foo' set to '${foo}'. Updated and deleted 'count'.`
    );
  });

  botManager.handleCommand('getvar', async (ctx: CustomContext) => {
    const foo = ctx.session.getCustom('foo');
    await ctx.api.sendMessage(ctx.chat.id, `Current value of 'foo': ${foo}`);
  });

  // Show user their chat ID (useful for admin setup)
  botManager.handleCommand('whoami', async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Your chat ID: <code>${ctx.from.id}</code>`,
      { parse_mode: 'HTML' }
    );
  });

  // Example: Only approved users with valid JWT can access this command
  botManager.handleCommand('secret', async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      'This is a secret command only for authenticated and approved users!'
    );
  });
}

createCombinedBot().catch(console.error);
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

## 📝 Command Menu Management

The SDK provides a convenient way to set up and manage your bot's command menu using the `setMyCommands` method. This allows you to define a list of commands that will appear in the bot's menu interface.

### **Setting Up Command Menu**

```typescript
botManager.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Show help information' },
  { command: 'settings', description: 'Configure bot settings' }
]);
```

The command menu will be displayed to users when they open the bot's chat interface, making it easier for them to discover and use available commands.

---

## 🔍 Professional Logging System

The SDK includes a professional logging system built with Pino that automatically adapts to your environment:

- In development mode (`isDev: true`), you get detailed, colorized logs
- In production mode (`isDev: false`), logs are minimized to essential information

### **Logger Features**

- 🎨 **Colorized Output**: Development logs are colorized for better readability
- ⏰ **Timestamp Information**: Each log includes precise timestamp
- 🔍 **Debug Mode**: Extensive debugging information in development
- 🎯 **Production Ready**: Optimized, minimal logging in production
- 📊 **Log Levels**: Supports multiple log levels (debug, info, warn, error)

### **Using the Logger**

```typescript
import { createSdkLogger } from '@wasserstoff/mangi-tg-bot';

// Create a logger instance
const logger = createSdkLogger(config.isDev);

// Usage examples
logger.info('Bot initialized successfully');
logger.debug('Processing update:', update);
logger.warn('Rate limit approaching');
logger.error('Connection failed:', error);
```

### **Automatic Context Logging**

The SDK automatically includes logging in the bot context:

```typescript
botManager.handleCommand('example', async (ctx: CustomContext) => {
  // Logs are automatically controlled by isDev setting
  ctx.logger.info('Processing example command');
  ctx.logger.debug('Session state:', ctx.session);
  
  await ctx.reply('Command processed!');
});
```

### **Production vs Development Logging**

- **Development Mode** (`isDev: true`):
  - Detailed debug information
  - Session state logging
  - Command processing details
  - Redis operations logging
  - Colorized, formatted output

- **Production Mode** (`isDev: false`):
  - Critical errors only
  - Important state changes
  - Minimal operational logs
  - Optimized for performance

To switch between modes, simply set `isDev` in your configuration:

```typescript
const config: AppConfig = {
  // ... other config options ...
  isDev: process.env.NODE_ENV !== 'production'
};
```

---

## 👥 Admin Authentication/Approval

Add an extra layer of admin approval for new users. This is ideal for public or semi-public bots, clubs, or organizations where you want to control who can use the bot.

- **New users** are set to `pending` in Redis and cannot use the bot until approved.
- **Admins** receive approval requests and can approve/deny users via inline buttons.
- **Only approved users** (status `member` or `admin`) can interact with the bot.

### How it works
1. When a new user interacts with the bot, their status is set to `pending` in Redis.
2. All admins (specified in `adminChatIds`) receive a message with Approve/Deny buttons.
3. When an admin approves, the user's status is set to `member` and they are notified.
4. Only users with status `member` or `admin` can use the bot; others are blocked until approved.

### Example: Admin Approval
```typescript
const configWithAdminAuth: AppConfig = {
  botToken: 'YOUR_BOT_TOKEN',
  botMode: 'polling',
  botAllowedUpdates: ['message', 'callback_query'],
  redisUrl: 'YOUR_REDIS_URL',
  isDev: true,
  useAuth: 'none',
  adminAuthentication: true,
  adminChatIds: [123456789, 987654321], // Replace with your admin Telegram chat IDs
};

const bot = new Bot(configWithAdminAuth);
const botManager = bot.getBotManager();
botManager.handleCommand('start', async (ctx: CustomContext) => {
  await ctx.reply('Welcome! If you see this, you are approved by an admin.');
});
botManager.handleCommand('whoami', async (ctx: CustomContext) => {
  await ctx.reply(`Your chat ID: <code>${ctx.from?.id}</code>`, { parse_mode: 'HTML' });
});
botManager.handleCommand('secret', async (ctx: CustomContext) => {
  await ctx.reply('This is a secret command only for approved users!');
});
```

---

## 🛡️ Automatic Context Safety (No More !)

The SDK now ensures that `ctx.session`, `ctx.chat`, and `ctx.from` are always present in your handlers. You can safely use `ctx.session.whatever`, `ctx.chat.id`, etc., **without** needing to write `ctx.session!` or add type guards.

This is handled automatically by the SDK's internal middleware and does **not** require any code changes for existing users.

**Example:**
```typescript
botManager.handleCommand('start', async (ctx: CustomContext) => {
  // No need for ctx.session! or ctx.chat!
  ctx.session.setCustom('foo', 'bar');
  await ctx.api.sendMessage(ctx.chat.id, 'Welcome!');
});
```

---

## 📄 License

ISC

## 📚 GitHub Repository

This project is available on GitHub:
[https://github.com/AmanUpadhyay1609/-wasserstoff-mangi-tg-bot](https://github.com/AmanUpadhyay1609/-wasserstoff-mangi-tg-bot)

Issues, feature requests, and contributions are welcome!
