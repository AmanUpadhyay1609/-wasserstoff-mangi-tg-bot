# @wasserstoff/mangi-tg-bot SDK

A powerful and flexible Telegram Bot SDK built with TypeScript, featuring session management, command handling, database integration, and built-in authentication.

## 🚀 Features

- ✨ Easy command creation and management
- 📱 Interactive button menus
- 💾 Redis session management
- 🗄️ MongoDB integration
- 🔄 Webhook and polling support
- 🛡️ Type-safe development
- 🎯 Middleware support
- 📝 Message handling
- 🔘 Callback query handling
- 🔐 Built-in JWT authentication

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## 🛠️ Installation

```bash
npm install @wasserstoff/mangi-tg-bot
```

## 📖 Usage Examples

### Basic Bot Setup

```typescript
import { Bot, AppConfig } from '@wasserstoff/mangi-tg-bot';

const config: AppConfig = {
    mongodbUri: 'mongodb://localhost:27017/mangi-tg-bot',
    botToken: 'YOUR_BOT_TOKEN',
    botMode: 'polling',
    botAllowedUpdates: ['message', 'callback_query'],
    redisUrl: 'redis://localhost:6379',
    isDev: true,
    // Authentication is optional. Set useAuth to "none" to disable extra layer authentication.
    useAuth: "none"
};

async function main() {
    // Create Bot instance
    const bot = new Bot(config);
    const botManager = bot.getBotManager();

    // Initialize bot
    await bot.initialize();
}

main();
```

### Setting Up Authentication

The SDK provides built-in JWT authentication for your bot users. To enable it:

```typescript
import { Bot, AppConfig } from '@wasserstoff/mangi-tg-bot';

const configWithAuth: AppConfig = {
    mongodbUri: 'mongodb://localhost:27017/mangi-tg-bot',
    botToken: 'YOUR_BOT_TOKEN',
    botMode: 'polling',
    botAllowedUpdates: ['message', 'callback_query'],
    redisUrl: 'redis://localhost:6379',
    isDev: true,
    // Enable authentication (global auth via useAuth set to "fully")
    useAuth: "fully",
    // Required when useAuth is "fully" or "partially"
    jwtSecret: 'your-secret-key-here'
};

async function createAuthenticatedBot() {
    const bot = new Bot(configWithAuth);
    const botManager = bot.getBotManager();
    
    // Add commands
    botManager.createCommand("start", "Welcome to the authenticated bot!");
    
    // Example of a secure handler that requires authentication
    botManager.handleMessage("secure", async (ctx) => {
        // The authentication middleware ensures the user is verified
        await ctx.reply("This is a secure message that requires authentication!");
        
        // Show token info
        if (ctx.session?.jwtToken) {
            const decoded = JSON.stringify(
                require('jsonwebtoken').decode(ctx.session.jwtToken),
                null, 2
            );
            await ctx.reply(`Your token info:\n\n<pre>${decoded}</pre>`, {
                parse_mode: "HTML"
            });
        }
    });
    
    // Initialize the bot
    await bot.initialize();
}

createAuthenticatedBot();
```

When authentication is enabled:
- Each user gets a unique JWT token stored in their session
- Tokens contain user ID and chat ID for verification
- Tokens are automatically refreshed if invalid or expired
- Access user token info via `ctx.session.jwtToken`

### Partial Authentication Setup

If you prefer to enable authentication selectively for certain routes rather than globally, you can set `useAuth` to "partially" in your configuration. In this mode, the global authentication middleware is not applied automatically, giving you the flexibility to secure only specific commands or message handlers.

To secure a specific route, use the following methods provided by the SDK:

- `createCommandWithAuth`: Registers a command that requires authentication before executing.
- `handleCallbackWithAuth`: Secures a callback query handler with authentication.
- `handleMessageWithAuth`: Registers a message handler with authentication.

For example:

```typescript
// Configuration with partial authentication
const configPartialAuth: AppConfig = {
    mongodbUri: 'mongodb://localhost:27017/mangi-tg-bot',
    botToken: 'YOUR_BOT_TOKEN',
    botMode: 'polling',
    botAllowedUpdates: ['message', 'callback_query'],
    redisUrl: 'redis://localhost:6379',
    isDev: true,
    // Enable partial authentication
    useAuth: "partially",
    jwtSecret: 'your-secret-key-here'
};

const bot = new Bot(configPartialAuth);
const botManager = bot.getBotManager();

// Create a command with authentication
botManager.createCommandWithAuth("secure", "This is a secure command with partial authentication.");

// Create a callback with authentication
botManager.handleCallbackWithAuth("secure_callback", async (ctx) => {
    await ctx.reply("Authenticated callback executed.");
});

// Create a message handler with authentication
botManager.handleMessageWithAuth("secure", async (ctx) => {
    await ctx.reply("Authenticated message handler executed.");
});
```

**Important:** When `useAuth` is set to "none", authentication is completely disabled. In this case, even if you call the `...WithAuth` methods, the SDK will restrict their usage by checking for a configured `jwtSecret` and logging an error. This ensures that authentication-related functionality is only available when authentication is explicitly enabled via "fully" or "partially".

### Creating Commands

```typescript
// Simple command
botManager.createCommand("start", "Welcome to the bot! 👋");

// Command with buttons
botManager.createCommand(
    "menu",
    "Main Menu - Select an option:",
    [
        [{ text: "📊 Statistics", callback_data: "stats" }],
        [{ text: "⚙️ Settings", callback_data: "settings" }]
    ]
);
```

### Handling Callbacks

```typescript
// Handle button clicks
botManager.handleCallback("stats", async (ctx) => {
    await ctx.reply("📊 Your Statistics:\n" +
        "- Total Messages: 150\n" +
        "- Active Days: 7\n" +
        "- Rank: Advanced User");
});

botManager.handleCallback("settings", async (ctx) => {
    await ctx.reply("⚙️ Settings Menu:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🔔 Notifications", callback_data: "notif" }],
                [{ text: "🌍 Language", callback_data: "lang" }]
            ]
        }
    });
});
```

### Message Handling

```typescript
// Handle specific text
botManager.handleMessage("hello", async (ctx) => {
    await ctx.reply(`Hello ${ctx.from.first_name}! 👋`);
});

// Handle regex patterns
botManager.handleMessage(/^price [0-9]+$/, async (ctx) => {
    const price = ctx.message.text.split(" ")[1];
    await ctx.reply(`Price set to: $${price}`);
});

// Handle media
botManager.bot.on("message:photo", async (ctx) => {
    await ctx.reply("Thanks for the photo! 📸");
});
```

### Working with Databases

```typescript
// Store user data in MongoDB
await botManager.storeUserData(userId, {
    name: "John Doe",
    preferences: { theme: "dark" }
});

// Retrieve user data
const userData = await botManager.getUserData(userId);

// Store temporary data in Redis (with optional expiry)
await botManager.setTempData("user:status:" + userId, "active", 3600); // expires in 1 hour

// Get temporary data
const status = await botManager.getTempData("user:status:" + userId);
```

## 🏗️ Project Structure

```
├── bot/
│ ├── features/ # Bot features and command handlers
│ ├── middlewares/ # Custom middlewares
│ ├── helper/ # Helper functions
│ ├── context/ # Custom context definitions
│ └── BotManager.ts # Main bot management class
├── database/ # Database connections
├── config.ts # Configuration management
└── index.ts # Main entry point
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
