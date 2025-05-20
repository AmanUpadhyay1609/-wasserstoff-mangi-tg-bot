import { Middleware } from "grammy";
import { CustomContext } from "../context/CustomContext";

// Helper to get Redis key for user status
function getUserStatusKey(botUsername: string) {
  return `bot:${botUsername}:user_status`;
}

// Helper to get status for a user
async function getUserStatus(redis: any, key: string, chatId: number) {
  return await redis.hget(key, String(chatId));
}

// Helper to set status for a user
async function setUserStatus(redis: any, key: string, chatId: number, status: string) {
  await redis.hset(key, String(chatId), status);
}

// Helper to get all admin chat IDs from config
function getAdminChatIds(ctx: CustomContext): number[] {
  return (ctx.config && ctx.config.adminChatIds) || [];
}

// Helper to get bot username
function getBotUsername(ctx: CustomContext): string {
  return ctx.me?.username || "unknownbot";
}

const adminAuthMiddleware: Middleware<CustomContext> = async (ctx, next) => {
  console.log(`inside adminAuthMiddleware`);
  const config = ctx.config || (ctx as any).config;
  const adminAuthEnabled = config?.adminAuthentication;
  const adminChatIds = config?.adminChatIds || [];
  const botUsername = getBotUsername(ctx);
  const redis = (ctx as any).__rawRedis;
  console.log('adminAuthEnabled:', adminAuthEnabled);
  console.log('redis:', redis ? 'present' : 'missing', 'type:', typeof redis);
  console.log('botUsername:', botUsername);
  console.log('adminChatIds:', adminChatIds);
  if (!adminAuthEnabled || !redis || !botUsername || adminChatIds.length === 0) {
    console.log('Skipping adminAuthMiddleware due to missing config:', {
      adminAuthEnabled, redis: !!redis, botUsername, adminChatIdsLength: adminChatIds.length
    });
    return next();
  }

  // Only check for private chats (users)
  if (!ctx.chat || ctx.chat.type !== "private") {
    return next();
  }

  const userId = ctx.from?.id;
  console.log(`request from user ${userId}`);
  if (!userId) return next();
  const statusKey = getUserStatusKey(botUsername);

  // Admins always allowed
  if (adminChatIds.includes(userId)) {
    // Ensure admin status in Redis
    await setUserStatus(redis, statusKey, userId, "admin");
    return next();
  }

  // Check user status
  let status = await getUserStatus(redis, statusKey, userId);
  if (status === "member" || status === "admin") {
    return next();
  }
  if (status === "pending") {
    await ctx.reply("Your approval is pending. Please wait for an admin to approve your access.");
    return;
  }
  // New user: set to pending, notify admins
  await setUserStatus(redis, statusKey, userId, "pending");
  await ctx.reply("Your approval is pending. Please wait for an admin to approve your access.");
  // Send approval request to all admins
  for (const adminId of adminChatIds) {
    await ctx.api.sendMessage(adminId, `User <code>${userId}</code> (@${ctx.from?.username || "unknown"}) requests access.`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "Approve", callback_data: `adminauth:approve:${userId}` },
          { text: "Deny", callback_data: `adminauth:deny:${userId}` }
        ]]
      }
    });
  }
};

// Handler for approval/deny callback queries
export const adminAuthCallbackHandler: Middleware<CustomContext> = async (ctx, next) => {
  console.log(`Inside adminAuthCallbackHandler..........`);
  if (!ctx.callbackQuery?.data?.startsWith("adminauth:")) return next();
  const redis = (ctx as any).__rawRedis;
  const botUsername = getBotUsername(ctx);
  const statusKey = getUserStatusKey(botUsername);
  const adminChatIds = getAdminChatIds(ctx);
  const [_, action, userIdStr] = ctx.callbackQuery.data.split(":");
  const userId = Number(userIdStr);
  if (!adminChatIds.includes(ctx.from?.id!)) {
    await ctx.answerCallbackQuery({ text: "Only admins can approve/deny requests.", show_alert: true });
    return;
  }
  if (action === "approve") {
    await setUserStatus(redis, statusKey, userId, "member");
    await ctx.api.sendMessage(userId, "You have been approved by an admin. You can now use the bot.");
    await ctx.editMessageText("User approved.");
    await ctx.answerCallbackQuery({ text: "User approved." });
  } else if (action === "deny") {
    await setUserStatus(redis, statusKey, userId, "pending"); // or remove if you want
    await ctx.api.sendMessage(userId, "Your request was denied by an admin.");
    await ctx.editMessageText("User denied.");
    await ctx.answerCallbackQuery({ text: "User denied." });
  }
};

export default adminAuthMiddleware; 