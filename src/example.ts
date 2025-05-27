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
  const botManager = bot.getBotManager();
  await bot.initialize();

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
  const botManager = bot.getBotManager();
  await bot.initialize();

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
  botToken: "YOUR_BOT_TOKEN", // Replace with your actual token
  botMode: "polling",
  botAllowedUpdates: ["message", "callback_query"],
  redisUrl: "redis://localhost:6379",
  isDev: true,
  useAuth: "none",
};

async function createSessionCrudBot() {
  logger.info("Starting bot with session CRUD example:", configWithSessionCrud);
  const bot = new Bot(configWithSessionCrud);
  const botManager = bot.getBotManager();
  await bot.initialize();

  botManager.handleCommand("setvar", async (ctx: CustomContext) => {
    ctx.session.setCustom("foo", "bar");
    const foo = ctx.session.getCustom("foo");
    ctx.session.updateCustom({ hello: "world", count: 1 });
    ctx.session.deleteCustom("count");
    if (typeof ctx.session.save === "function") {
      ctx.session.save(() => {});
    }
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Session custom variable 'foo' set to '${foo}'. Updated and deleted 'count'.`
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
  botToken: "7717043976:AAGSkIgTIdicgOhbn8h6Zsg7QTHObkp7nNw", // Replace with your actual token
  botMode: "polling",
  botAllowedUpdates: ["message", "callback_query"],
  redisUrl: "redis://localhost:6379",
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
  const botManager = bot.getBotManager();
  await bot.initialize();

  // Only accessible if JWT is valid AND user is approved by admin
  botManager.handleCommand("start", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "Welcome! You are authenticated and approved by an admin."
    );
  });

  // Session CRUD helpers
  botManager.handleCommand("setvar", async (ctx: CustomContext) => {
    ctx.session.setCustom("foo", "bar");
    const foo = ctx.session.getCustom("foo");
    ctx.session.updateCustom({ hello: "world", count: 1 });
    ctx.session.deleteCustom("count");
    if (typeof ctx.session.save === "function") {
      ctx.session.save(() => {});
    }
    await ctx.api.sendMessage(
      ctx.chat.id,
      `Session custom variable 'foo' set to '${foo}'. Updated and deleted 'count'.`
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

  // Example: Only approved users with valid JWT can access this command
  botManager.handleCommand("secret", async (ctx: CustomContext) => {
    await ctx.api.sendMessage(
      ctx.chat.id,
      "This is a secret command only for authenticated and approved users!"
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
