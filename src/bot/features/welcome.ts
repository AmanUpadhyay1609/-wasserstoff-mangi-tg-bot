import { Composer } from "grammy";
import { CustomContext } from "../context/CustomContext";
import { logHandle } from "../helper/logger";
import { logger } from "../../logger";

const composer = new Composer<CustomContext>();

const feature = composer.chatType("private");

feature.command("start", logHandle("command-start"), async (ctx) => {
  console.log("User hit /start");
  console.log(`telegram context-->`, ctx.chat?.id, `session-->`, JSON.stringify(ctx.session));
  
  // Log session data for debugging
  logger.info(`Session data for user ${ctx.from?.id}: ${JSON.stringify(ctx.session)}`);
  
  // Show token info in response
  let welcomeMessage = "Welcome to the bot!";
  if (ctx.session?.jwtToken) {
    const tokenPreview = ctx.session.jwtToken.substring(0, 10) + "...";
    welcomeMessage += `\n\nYou are authenticated with token: ${tokenPreview}`;
  } else {
    welcomeMessage += "\n\nYou are not authenticated yet.";
  }
  
  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [[{ text: "Say hi!", callback_data: "say_hi" }]],
    },
    parse_mode: "HTML",
  });
});

// Add a debug command to check session
feature.command("debug", async (ctx) => {
  logger.debug(`Debug command - Session: ${JSON.stringify(ctx.session)}`);
  const sessionInfo = JSON.stringify(ctx.session, null, 2);
  await ctx.reply(`Your session data:\n\n<pre>${sessionInfo}</pre>`, {
    parse_mode: "HTML"
  });
});

// Add as much commands as you want

export { composer as welcomeFeature };
