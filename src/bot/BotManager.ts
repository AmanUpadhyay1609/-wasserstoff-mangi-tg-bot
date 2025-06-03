import { Bot, Composer } from "grammy";
import { createSdkLogger } from "../logger";
import { createBot, IBot } from ".";
import { AppConfig } from "..";
import { CustomContext } from "./context/CustomContext";
import { createAuthMiddleware } from "./middlewares/auth";

export class BotManager {
    private bot: IBot;
    private config: AppConfig;
    private composer: Composer<CustomContext>;
    private registeredCommands: Array<{ command: string; description: string }> = [];
    private sdkLogger: ReturnType<typeof createSdkLogger>;
    private messageHandlers: Array<{ filter: (ctx: CustomContext) => boolean, handler: (ctx: CustomContext) => Promise<void> }> = [];
    private callbackHandlers: Array<{ filter: (ctx: CustomContext) => boolean, handler: (ctx: CustomContext) => Promise<void> }> = [];
    private messageHandlersWithAuth: Array<{ filter: (ctx: CustomContext) => boolean, handler: (ctx: CustomContext) => Promise<void> }> = [];
    private callbackHandlersWithAuth: Array<{ filter: (ctx: CustomContext) => boolean, handler: (ctx: CustomContext) => Promise<void> }> = [];

    constructor(botToken: string, redisInstance: any, config: AppConfig) {
        this.bot = createBot(botToken, redisInstance, config);
        this.composer = new Composer<CustomContext>();
        this.config = config;
        this.sdkLogger = createSdkLogger(config.isDev);
        this.bot.use(this.composer);

        // Register a single message dispatcher (non-auth)
        this.composer.on("message", async (ctx: CustomContext, next) => {
            // If this is a command, skip custom message handlers
            if (ctx.message && ctx.message.text && ctx.message.text.startsWith("/")) {
                // Let .command() handlers run
                return await next();
            }
            for (const { filter, handler } of this.messageHandlers) {
                if (filter(ctx)) {
                    if (this.config.isDev) {
                        this.sdkLogger.info(`Message handler matched and executed`);
                    }
                    try {
                        await handler(ctx);
                    } catch (error) {
                        if (this.config.isDev) {
                            this.sdkLogger.error("Error handling message:", error);
                        }
                        await ctx.reply("Sorry, there was an error processing your message.");
                    }
                    return; // Only the first matching handler runs
                }
            }
            await next();
        });

        // Register a single callback dispatcher (non-auth)
        this.composer.on("callback_query", async (ctx: CustomContext, next) => {
            for (const { filter, handler } of this.callbackHandlers) {
                if (filter(ctx)) {
                    if (this.config.isDev) {
                        this.sdkLogger.info(`Callback handler matched and executed`);
                    }
                    try {
                        await handler(ctx);
                        await ctx.answerCallbackQuery();
                    } catch (error) {
                        if (this.config.isDev) {
                            this.sdkLogger.error("Error handling callback query:", error);
                        }
                        await ctx.answerCallbackQuery({
                            text: "Error processing callback query",
                        });
                    }
                    return; // Only the first matching handler runs
                }
            }
            await next();
        });

        // Register a single message dispatcher (auth)
        this.composer.on("message", async (ctx: CustomContext, next) => {
            if (!this.config.jwtSecret) return await next();
            // If this is a command, skip custom message handlers
            if (ctx.message && ctx.message.text && ctx.message.text.startsWith("/")) {
                return await next();
            }
            const authMiddleware = createAuthMiddleware(this.config.jwtSecret);
            for (const { filter, handler } of this.messageHandlersWithAuth) {
                if (filter(ctx)) {
                    if (this.config.isDev) {
                        this.sdkLogger.info(`Auth message handler matched and executed`);
                    }
                    try {
                        await authMiddleware(ctx, async () => handler(ctx));
                    } catch (error) {
                        if (this.config.isDev) {
                            this.sdkLogger.error("Error handling auth message:", error);
                        }
                        await ctx.reply("Sorry, there was an error processing your message with auth.");
                    }
                    return;
                }
            }
            await next();
        });

        // Register a single callback dispatcher (auth)
        this.composer.on("callback_query", async (ctx: CustomContext, next) => {
            if (!this.config.jwtSecret) return await next();
            const authMiddleware = createAuthMiddleware(this.config.jwtSecret);
            for (const { filter, handler } of this.callbackHandlersWithAuth) {
                if (filter(ctx)) {
                    if (this.config.isDev) {
                        this.sdkLogger.info(`Auth callback handler matched and executed`);
                    }
                    try {
                        await authMiddleware(ctx, async () => handler(ctx));
                        await ctx.answerCallbackQuery();
                    } catch (error) {
                        if (this.config.isDev) {
                            this.sdkLogger.error("Error handling auth callback:", error);
                        }
                        await ctx.answerCallbackQuery({ text: "Error processing auth callback" });
                    }
                    return;
                }
            }
            await next();
        });
    }

    public handleCommand(
        command: string,
        handler: (ctx: CustomContext) => Promise<void>,
        message?: string,
        buttons?: Array<Array<{ text: string; callback_data: string }>>
    ): void {
        if (this.config.isDev) {
            this.sdkLogger.info(`Registering command /${command}`);
        }
        // Only register command once.
        if (!this.registeredCommands.some((cmd) => cmd.command === command)) {
            this.registeredCommands.push({
                command: command,
                description: `Execute /${command} command`,
            });
        }

        this.composer.command(command, async (ctx: CustomContext) => {
            try {
                await handler(ctx);
                if (message) {
                    await ctx.reply(message, {
                        parse_mode: "HTML",
                        reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
                    });
                }
                if (this.config.isDev) {
                    this.sdkLogger.info(`Command /${command} executed successfully`);
                }
            } catch (error) {
                if (this.config.isDev) {
                    this.sdkLogger.error(`Error executing command /${command}:`, error);
                }
                await ctx.reply("Sorry, there was an error executing this command.");
            }
        });
    }

    public async setMyCommands(commands: Array<{ command: string; description: string }>): Promise<void> {
        try {
            await this.bot.api.setMyCommands(commands);
        } catch (error) {
            if (this.config.isDev) {
                this.sdkLogger.error("Error setting command menu:", error);
            }
        }
    }

    public handleCallback(
        filter: (ctx: CustomContext) => boolean,
        handler: (ctx: CustomContext) => Promise<void>
    ): void {
        if (this.config.isDev) {
            this.sdkLogger.info(`Registering callback handler`);
        }
        this.callbackHandlers.push({ filter, handler });
    }

    public handleMessage(
        filter: (ctx: CustomContext) => boolean,
        handler: (ctx: CustomContext) => Promise<void>
    ): void {
        if (this.config.isDev) {
            this.sdkLogger.info(`Registering message handler`);
        }
        this.messageHandlers.push({ filter, handler });
    }

    public async start(): Promise<void> {
        try {
            if (this.config.botMode === "webhook") {
                if (this.config.isDev) {
                    this.sdkLogger.info("Starting bot in webhook mode...");
                }
                await this.bot.init();
                await this.bot.api.setWebhook(this.config.botWebhookUrl as string, {
                    allowed_updates: this.config.botAllowedUpdates as any,
                });
            } else if (this.config.botMode === "polling") {
                if (this.config.isDev) {
                    this.sdkLogger.info("Starting bot in polling mode...");
                }
                await new Promise<void>((resolve, reject) => {
                    this.bot
                        .start({
                            allowed_updates: this.config.botAllowedUpdates as any,
                            onStart: ({ username }) => {
                                if (this.config.isDev) {
                                    this.sdkLogger.info("Bot running...", { username });
                                }
                                resolve();
                            },
                        })
                        .catch((error) => {
                            if (this.config.isDev) {
                                this.sdkLogger.error("Error starting bot:", error);
                            }
                            reject(error);
                        });
                });
            }
        } catch (error) {
            if (this.config.isDev) {
                this.sdkLogger.error("Error starting BotManager:", error);
            }
            throw error;
        }
    }

    public async stop(): Promise<void> {
        try {
            await this.bot.stop();
            if (this.config.isDev) {
                this.sdkLogger.info("Bot stopped successfully");
            }
        } catch (error) {
            if (this.config.isDev) {
                this.sdkLogger.error("Error stopping bot:", error);
            }
            throw error;
        }
    }

    public getBot(): Bot<CustomContext> {
        return this.bot;
    }

    public handleCommandWithAuth(
        command: string,
        handler: (ctx: CustomContext) => Promise<void>,
        message?: string,
        buttons?: Array<Array<{ text: string; callback_data: string }>>
    ): void {
        if (!this.config.jwtSecret) {
            if (this.config.isDev) {
                this.sdkLogger.error("JWT secret not configured for authentication. Cannot register auth command.");
            }
            return;
        }
        if (this.config.isDev) {
            this.sdkLogger.info(`Registering command with auth /${command}`);
        }
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
                await handler(ctx);
                if (message) {
                    await ctx.reply(message, {
                        parse_mode: "HTML",
                        reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
                    });
                }
                if (this.config.isDev) {
                    this.sdkLogger.info(`Auth command /${command} executed successfully`);
                }
            } catch (error) {
                if (this.config.isDev) {
                    this.sdkLogger.error(`Error executing auth command /${command}:`, error);
                }
                await ctx.reply("Sorry, there was an error executing this command with auth.");
            }
        });
    }

    public handleCallbackWithAuth(
        filter: (ctx: CustomContext) => boolean,
        handler: (ctx: CustomContext) => Promise<void>
    ): void {
        if (!this.config.jwtSecret) {
            if (this.config.isDev) {
                this.sdkLogger.error("JWT secret not configured for authentication. Cannot register auth callback.");
            }
            return;
        }
        if (this.config.isDev) {
            this.sdkLogger.info(`Registering auth callback handler`);
        }
        this.callbackHandlersWithAuth.push({ filter, handler });
    }

    public handleMessageWithAuth(
        filter: (ctx: CustomContext) => boolean,
        handler: (ctx: CustomContext) => Promise<void>
    ): void {
        if (!this.config.jwtSecret) {
            if (this.config.isDev) {
                this.sdkLogger.error("JWT secret not configured for authentication. Cannot register auth message handler.");
            }
            return;
        }
        if (this.config.isDev) {
            this.sdkLogger.info(`Registering auth message handler`);
        }
        this.messageHandlersWithAuth.push({ filter, handler });
    }
} 
