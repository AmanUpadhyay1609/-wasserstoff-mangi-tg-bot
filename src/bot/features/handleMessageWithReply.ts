export const handleMessageWithReply = async (ctx: any) => {
  let text = ctx.message.text;
  ctx.api.sendMessage(ctx.chat.id, `User send ${text} without reply`);
  //Every message user type with being force reply true will be handled here you can do anything you want use complicated logic to handle messages... sky is the limit , 
};
