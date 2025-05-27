import { Composer } from "grammy";
import { CustomContext } from "../context/CustomContext";
import { logHandle } from "../helper/logger";
import { handleMessageWithoutReply } from "./handleMessageWithoutReply";
import { handleMessageWithReply } from "./handleMessageWithReply";

const composer = new Composer<CustomContext>();

const feature = composer.chatType("private");
feature.on("message", logHandle("unhandled-message"), async (ctx) => {
  ctx.api.sendChatAction(ctx.chat.id, "typing");
  if (ctx.message.reply_to_message) {
    await handleMessageWithReply(ctx);
  } else {
    await handleMessageWithoutReply(ctx);
  }
});

feature
  .filter((ctx) => ctx.callbackQuery?.data === "say_hi")
  .on("callback_query", async (ctx) => {
    ctx.api.sendMessage(ctx.chat.id, `hi ${ctx.from?.first_name}`);
  });

  //Add more features, features in the main sense when user click one of the button on telegram then what happen after that handles here--> This files serves of what happens after user click a tg button

export { composer as unhandledFeature };
