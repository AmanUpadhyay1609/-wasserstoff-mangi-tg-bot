// import { Bot, AppConfig, CustomContext, logger } from "@wasserstoff/mangi-tg-bot"; //When using the sdk package
import Redis from "ioredis";
import { Bot, AppConfig, CustomContext, logger } from "./index"; 

// ---
// 1. JWT Authentication Example
// ---
const configWithJwtAuth: AppConfig = {
  botToken: "YOUR_BOT_TOKEN", // Replace with your actual token
  botMode: "polling",
  botAllowedUpdates: ["message", "callback_query"],
  redisUrl: "redis://localhost:6379",
  isDev: true,
  useAuth: "fully", // All routes require JWT authentication
  jwtSecret: "your_jwt_secret_here",
};

async function createJwtAuthBot() {
  logger.info("Starting bot with JWT authentication:", configWithJwtAuth);
  const bot = new Bot(configWithJwtAuth);
  await bot.initialize();
  const botManager = bot.getBotManager();

  botManager.handleCommand("start", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "Welcome! You are authenticated with JWT."
    );
  });
  botManager.handleCommand("whoami", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Your chat ID: <code>${ctx.from.id}</code>`,
      { parse_mode: "HTML" }
    );
  });
}

// ---
// 2. Admin Authentication/Approval Example
// ---
const configWithAdminAuth: AppConfig = {
  botToken: "YOUR_BOT_TOKEN", // Replace with your actual token
  botMode: "polling",
  botAllowedUpdates: ["message", "callback_query"],
  redisUrl: "redis://localhost:6379",
  isDev: true,
  useAuth: "none",
  adminAuthentication: true, // Enable admin approval system
  adminChatIds: [123456789, 987654321], // Replace with your admin Telegram chat IDs
};

async function createAdminAuthBot() {
  logger.info("Starting bot with admin authentication:", configWithAdminAuth);
  const bot = new Bot(configWithAdminAuth);
  await bot.initialize();
  const botManager = bot.getBotManager();

  botManager.handleCommand("start", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "Welcome! If you see this, you are approved by an admin."
    );
  });
  botManager.handleCommand("whoami", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Your chat ID: <code>${ctx.from.id}</code>`,
      { parse_mode: "HTML" }
    );
  });
  botManager.handleCommand("secret", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "This is a secret command only for approved users!"
    );
  });
}

// ---
// 3. Session CRUD Operations Example
// ---
const configWithSessionCrud: AppConfig = {
  botToken: "YOUR_BOT_SESSION", // Replace with your actual token
  botMode: "polling",
  botAllowedUpdates: ["message", "callback_query"],
  redisUrl: "redis://localhost:6379",
  isDev: true,
  useAuth: "none",
};

async function createSessionCrudBot() {
  logger.info("Starting bot with session CRUD example:", configWithSessionCrud);
  const bot = new Bot(configWithSessionCrud);
  await bot.initialize();
  const botManager = bot.getBotManager();

  botManager.handleCommand("setvar", async (ctx: CustomContext) => {
    // Demonstrate setCustom
    const setResult = ctx.session.setCustom("foo", "bar");
    // Demonstrate getCustom (should return 'bar')
    const foo = ctx.session.getCustom("foo");
    // Demonstrate updateCustom
    const updateResult = ctx.session.updateCustom({ hello: "world", count: 1 });
    // Demonstrate deleteCustom (should return true)
    const deleteResult = ctx.session.deleteCustom("count");
    // Demonstrate deleteCustom for non-existent key (should return false)
    const deleteMissing = ctx.session.deleteCustom("notfound");
    // Demonstrate getCustom for non-existent key (should return undefined)
    const missing = ctx.session.getCustom("notfound");
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Session custom variable 'foo' set: ${setResult}\n
      Value of 'foo': ${foo}\n
      Update result: ${updateResult}\n
      Delete 'count' result: ${deleteResult}\n
      Delete 'notfound' result: ${deleteMissing}\n
      Get 'notfound': ${missing}`,
      { parse_mode: "HTML" }
    );
  });
  botManager.handleCommand("getvar", async (ctx: CustomContext) => {
    const foo = ctx.session.getCustom("foo");
    await ctx.api.sendMessage(ctx.chat.id, `Current value of 'foo': ${foo}`);
  });
}

// ---
// 4. Combined Example: JWT Auth + Admin Auth + Session CRUD
// ---
const configCombined: AppConfig = {
  botToken: "YOUR_BOT_TOKEN", // Replace with your actual token
  botMode: "polling",
  botAllowedUpdates: ["message", "callback_query"],
  redisUrl: "YOUR_REDIS_URL",
  isDev: true,
  useAuth: "fully", // JWT auth required for all routes
  jwtSecret: "aman1211",
  adminAuthentication: true, // Enable admin approval system
  adminChatIds: [6469050225], // Replace with your admin Telegram chat IDs
};

async function createCombinedBot() {
  logger.info(
    "Starting combined bot with JWT, admin auth, and session CRUD:",
    configCombined
  );
  const bot = new Bot(configCombined);
  await bot.initialize();
  const botManager = bot.getBotManager();

  
  botManager.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "whoami", description: "Get your chat ID" },
    { command: "setvar", description: "Secret command" },
  ]);
  // Only accessible if JWT is valid AND user is approved by admin
  botManager.handleCommand("start", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "Welcome! You are authenticated and approved by an admin."
    );
  });

  // Session CRUD helpers
  botManager.handleCommand("setvar", async (ctx: CustomContext) => {
    // Demonstrate setCustom
    const setResult = ctx.session.setCustom("foo", "bar");
    // Demonstrate getCustom (should return 'bar')
    const foo = ctx.session.getCustom("foo");
    // Demonstrate updateCustom
    const updateResult = ctx.session.updateCustom({ hello: "world", count: 1 });
    // Demonstrate deleteCustom (should return true)
    const deleteResult = ctx.session.deleteCustom("count");
    // Demonstrate deleteCustom for non-existent key (should return false)
    const deleteMissing = ctx.session.deleteCustom("notfound");
    // Demonstrate getCustom for non-existent key (should return undefined)
    const missing = ctx.session.getCustom("notfound");
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Session custom variable 'foo' set: ${setResult}\n` +
      `Value of 'foo': ${foo}\n` +
      `Update result: ${updateResult}\n` +
      `Delete 'count' result: ${deleteResult}\n` +
      `Delete 'notfound' result: ${deleteMissing}\n` +
      `Get 'notfound': ${missing}`
    );
  });
  botManager.handleCommand("getvar", async (ctx: CustomContext) => {
    const foo = ctx.session.getCustom("foo");
    await ctx.api.sendMessage(ctx.chat.id, `Current value of 'foo': ${foo}`);
  });

  // Show user their chat ID (useful for admin setup)
  botManager.handleCommand("whoami", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Your chat ID: <code>${ctx.from.id}</code>`,
      { parse_mode: "HTML" }
    );
  });

   botManager.handleCallback((ctx)=> ctx.callbackQuery.data === "xyz", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "This is xyz callback query response!",
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Click me 2", callback_data: "xyz2" }]],
        },
        parse_mode: "HTML",
      }
    );
  });

  botManager.handleCallback((ctx)=> ctx.callbackQuery.data === "xyz2", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "This is xyz2 callback query response!",
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Click me 3", callback_data: "xyz3" }]],
        },
        parse_mode: "HTML",
      }
    );
  });

  botManager.handleCallback((ctx)=> ctx.callbackQuery.data === "xyz3", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "This is xyz3 callback query response!",
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Click me 4", callback_data: "xyz4" }]],
        },
        parse_mode: "HTML",
      }
    );
  });

  // Example: Only approved users with valid JWT can access this command
  botManager.handleCommand("secret", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "This is a secret command only for authenticated and approved users!"
    );
  });
    botManager.handleMessage((ctx)=> ctx.message.text === "xyz2", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "This is xyz2 message response!",
      { parse_mode: "HTML",reply_markup: { inline_keyboard: [[{ text: "Click me", callback_data: "xyz" }]] } }
    );
  });
  botManager.handleMessage((ctx)=> ctx.message.text === "xyz", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "This is xyz message response!",
      { parse_mode: "HTML",reply_markup: { inline_keyboard: [[{ text: "Click me", callback_data: "xyz" }]] } }
    );
  });
}

// ---
// To test a use case, uncomment the corresponding function call below and provide your bot token and admin IDs.
// Only run ONE bot at a time.
// ---

// createJwtAuthBot();
// createAdminAuthBot();
// createSessionCrudBot();
createCombinedBot();
