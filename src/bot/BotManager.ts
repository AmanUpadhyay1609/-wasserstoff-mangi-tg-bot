import { Bot, Composer, Context } from "grammy";
import jwt from "jsonwebtoken";
import { logger } from "../logger";
import { createBot, IBot } from ".";
import { AppConfig } from "..";
import { CustomContext } from "./context/CustomContext";
import { createAuthMiddleware } from "./middlewares/auth";

export class BotManager {
    private bot: IBot;
    private config: AppConfig;
    private composer: Composer<CustomContext>;
    private registeredCommands: Array<{ command: string; description: string }> = [];

    constructor(botToken: string, redisInstance: any, config: AppConfig) {
        this.bot = createBot(botToken, redisInstance, config);
        this.composer = new Composer<CustomContext>();
        this.config = config;
        this.bot.use(this.composer);
    }

    public createCommand(
        command: string,
        message: string,
        buttons?: Array<Array<{ text: string; callback_data: string }>>
    ): void {
        logger.info(`Registering command /${command}`);
        // Only register command once.
        if (!this.registeredCommands.some((cmd) => cmd.command === command)) {
            this.registeredCommands.push({
                command: command,
                description: `Execute /${command} command`,
            });
        }

        // Add the command handler to the Composer.
        this.composer.command(command, async (ctx: Context) => {
            try {
                await ctx.reply(message, {
                    parse_mode: "HTML",
                    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
                });
                logger.info(`Command /${command} executed successfully`);
            } catch (error) {
                logger.error(`Error executing command /${command}:`, error);
                await ctx.reply("Sorry, there was an error executing this command.");
            }
        });
    }

    public async updateCommandMenu(): Promise<void> {
        try {
            // Set all registered commands at once.
            await this.bot.api.setMyCommands(this.registeredCommands);
        } catch (error) {
            logger.error("Error updating command menu:", error);
        }
    }

    public handleCallback(
        filter: string | RegExp,
        handler: (ctx: Context) => Promise<void>
    ): void {
        this.composer.callbackQuery(filter, async (ctx: Context) => {
            try {
                await handler(ctx);
                await ctx.answerCallbackQuery();
            } catch (error) {
                logger.error("Error handling callback query:", error);
                await ctx.answerCallbackQuery({
                    text: "Error processing callback query",
                });
            }
        });
    }

    public handleMessage(filter: string | RegExp, handler: (ctx: any) => Promise<void>) {
        this.composer.hears(filter, async (ctx) => {
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
                await new Promise<void>((resolve, reject) => {
                    this.bot
                        .start({
                            allowed_updates: this.config.botAllowedUpdates as any,
                            onStart: ({ username }) => {
                                logger.info("Bot running...", { username });
                                resolve();
                            },
                        })
                        .catch((error) => {
                            logger.error("Error starting bot:", error);
                            reject(error);
                        });
                });
            }
        } catch (error) {
            logger.error("Error starting BotManager:", error);
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

    public getBot(): Bot<Context> {
        return this.bot;
    }

    public createCommandWithAuth(command: string, message: string, buttons?: Array<Array<{ text: string; callback_data: string }>>): void {
        if (!this.config.jwtSecret) {
            logger.error("JWT secret not configured for authentication. Cannot register auth command.");
            return;
        }
        logger.info(`Registering command with auth /${command}`);
        if (!this.registeredCommands.some(cmd => cmd.command === command)) {
            this.registeredCommands.push({
                command: command,
                description: `Execute /${command} command with authentication`,
            });
        }
        const authMiddleware = createAuthMiddleware(this.config.jwtSecret);
        this.composer.command(command, async (ctx: CustomContext) => {
            await authMiddleware(ctx, async () => Promise.resolve());
            try {
                await ctx.reply(message, {
                    parse_mode: "HTML",
                    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
                });
                logger.info(`Auth command /${command} executed successfully`);
            } catch (error) {
                logger.error(`Error executing auth command /${command}:`, error);
                await ctx.reply("Sorry, there was an error executing this command with auth.");
            }
        });
    }

    public handleCallbackWithAuth(filter: string | RegExp, handler: (ctx: CustomContext) => Promise<void>): void {
        if (!this.config.jwtSecret) {
            logger.error("JWT secret not configured for authentication. Cannot register auth callback.");
            return;
        }
        const authMiddleware = createAuthMiddleware(this.config.jwtSecret);
        this.composer.callbackQuery(filter, async (ctx: CustomContext) => {
            await authMiddleware(ctx, async () => Promise.resolve());
            try {
                await handler(ctx);
                await ctx.answerCallbackQuery();
            } catch (error) {
                logger.error("Error handling auth callback:", error);
                await ctx.answerCallbackQuery({ text: "Error processing auth callback" });
            }
        });
    }

    public handleMessageWithAuth(filter: string | RegExp, handler: (ctx: CustomContext) => Promise<void>): void {
        if (!this.config.jwtSecret) {
            logger.error("JWT secret not configured for authentication. Cannot register auth message handler.");
            return;
        }
        const authMiddleware = createAuthMiddleware(this.config.jwtSecret);
        this.composer.hears(filter, async (ctx: CustomContext) => {
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
