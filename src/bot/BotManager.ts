import { Bot } from "grammy";
import jwt from "jsonwebtoken";
import { logger } from "../logger";
import { createBot, IBot } from ".";
import { AppConfig } from "..";
import { CustomContext } from "./context/CustomContext";
import { createAuthMiddleware } from "./middlewares/auth";

export class BotManager {
    private bot: IBot;
    private config: AppConfig;

    constructor(botToken: string, redisInstance: any, config: AppConfig) {
        this.bot = createBot(botToken, redisInstance, config);
        this.config = config;
    }

    public createCommand(command: string, message: string, buttons?: Array<Array<{ text: string, callback_data: string }>>) {
        logger.info(`Registering command /${command}`);

        // Register the command in the menu
        this.updateCommandMenu(command);

        // Register the command handler
        this.bot.command(command, async (ctx: CustomContext) => {
            try {
                await ctx.reply(message, {
                    parse_mode: "HTML",
                    reply_markup: buttons ? {
                        inline_keyboard: buttons
                    } : undefined
                });
                logger.info(`Command /${command} executed successfully`);
            } catch (error) {
                logger.error(`Error executing command /${command}:`, error);
                await ctx.reply("Sorry, there was an error executing this command.");
            }
        });
    }

    private async updateCommandMenu(newCommand: string) {
        try {
            // Get existing commands
            const existingCommands = await this.bot.api.getMyCommands();

            // Add new command if it doesn't exist
            if (!existingCommands.some(cmd => cmd.command === newCommand)) {
                await this.bot.api.setMyCommands([
                    ...existingCommands,
                    {
                        command: newCommand,
                        description: `Execute /${newCommand} command`
                    }
                ]);
            }
        } catch (error) {
            logger.error("Error updating command menu:", error);
        }
    }

    public handleCallback(callbackData: string, handler: (ctx: any) => Promise<void>) {
        this.bot.callbackQuery(callbackData, async (ctx) => {
            await handler(ctx);
            await ctx.answerCallbackQuery();
        });
    }

    public handleMessage(filter: string | RegExp, handler: (ctx: any) => Promise<void>) {
        this.bot.hears(filter, async (ctx) => {
            try {
                await handler(ctx);
            } catch (error) {
                logger.error("Error handling message:", error);
                await ctx.reply("Sorry, there was an error processing your message.");
            }
        });
    }

    public async start(): Promise<void> {
        try {
            if (this.config.botMode === "webhook") {
                logger.info("Starting bot in webhook mode...");
                await this.bot.init();
                await this.bot.api.setWebhook(this.config.botWebhookUrl as string, {
                    allowed_updates: this.config.botAllowedUpdates as any,
                });
            } else if (this.config.botMode === "polling") {
                logger.info("Starting bot in polling mode...");
                await this.bot.start({
                    allowed_updates: this.config.botAllowedUpdates as any,
                    onStart: ({ username }) => {
                        logger.info({
                            msg: "Bot running...",
                            username,
                        });
                    },
                });
            }
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    public async stop(): Promise<void> {
        try {
            await this.bot.stop();
            logger.info("Bot stopped successfully");
        } catch (error) {
            logger.error("Error stopping bot:", error);
            throw error;
        }
    }

    public getBot(): IBot {       
        return this.bot;
    }

    public createCommandWithAuth(command: string, message: string, buttons?: Array<Array<{ text: string, callback_data: string }>>) {
        if (!this.config.jwtSecret) {
            logger.error("JWT secret not configured for authentication. Cannot register auth command.");
            return;
        }
        logger.info(`Registering command with auth /${command}`);
        this.updateCommandMenu(command);
        const authMiddleware = createAuthMiddleware(this.config.jwtSecret);
        this.bot.command(command, async (ctx: CustomContext) => {
            await authMiddleware(ctx, async () => Promise.resolve());
            try {
                await ctx.reply(message, {
                    parse_mode: "HTML",
                    reply_markup: buttons ? { inline_keyboard: buttons } : undefined
                });
                logger.info(`Auth command /${command} executed successfully`);
            } catch (error) {
                logger.error(`Error executing auth command /${command}:`, error);
                await ctx.reply("Sorry, there was an error executing this command with auth.");
            }
        });
    }

    public handleCallbackWithAuth(callbackData: string, handler: (ctx: any) => Promise<void>) {
        if (!this.config.jwtSecret) {
            logger.error("JWT secret not configured for authentication. Cannot register auth callback.");
            return;
        }
        const authMiddleware = createAuthMiddleware(this.config.jwtSecret);
        this.bot.callbackQuery(callbackData, async (ctx: CustomContext) => {
            await authMiddleware(ctx, async () => Promise.resolve());
            await handler(ctx);
            await ctx.answerCallbackQuery();
        });
    }

    public handleMessageWithAuth(filter: string | RegExp, handler: (ctx: any) => Promise<void>) {
        if (!this.config.jwtSecret) {
            logger.error("JWT secret not configured for authentication. Cannot register auth message handler.");
            return;
        }
        const authMiddleware = createAuthMiddleware(this.config.jwtSecret);
        this.bot.hears(filter, async (ctx: CustomContext) => {
            await authMiddleware(ctx, async () => Promise.resolve());
            try {
                await handler(ctx);
            } catch (error) {
                logger.error("Error handling auth message:", error);
                await ctx.reply("Sorry, there was an error processing your message with auth.");
            }
        });
    }
} 
