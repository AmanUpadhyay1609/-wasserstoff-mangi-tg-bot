import { onShutdown } from "node-graceful-shutdown";
import { logger } from "./logger";
import { BotManager } from "./bot/BotManager";
import { RedisManager } from "./database/RedisManager";
import { TelegramClient } from "telegram";
import { CustomContext } from "./bot/context/CustomContext";

export interface AppConfig {
  botToken: string;
  botMode: string;
  botWebhookUrl?: string;
  botAllowedUpdates: string[];
  redisUrl: string;
  isDev: boolean;
  // JWT authentication (optional)
  useAuth?: "fully" | "partial" | "none";
  jwtSecret?: string;
  // Admin authentication (optional)
  adminAuthentication?: boolean;
  adminChatIds?: number[];
}

export class Bot {
  private botManager: BotManager;
  private redisManager: RedisManager;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.redisManager = RedisManager.getInstance();
    this.botManager = new BotManager(
      config.botToken,
      this.redisManager.getClient(),
      config
    );
  }

  /**
   * Initialize the bot and connect to all required services
   */
  public async initialize(): Promise<void> {
    try {
      // Connect to Redis
      await this.redisManager.connect(this.config.redisUrl);
      // Start bot
      await this.botManager.start();
      // Setup graceful shutdown
      // this.setupShutdown();
      logger.info("Bot initialized successfully");
    } catch (error) {
      logger.error("Error initializing Bot:", error);
      throw error;
    }
  }

  /**
   * Get the Redis client instance
   */
  public getRedisClient() {
    return this.redisManager.getClient();
  }

  private setupShutdown(): void {
    onShutdown(async () => {
      logger.info("Initiating graceful shutdown...");
      try {
        // Stop bot
        await this.botManager.stop();
        // Disconnect from Redis
        await this.redisManager.disconnect();
        logger.info("Shutdown completed successfully");
      } catch (error) {
        logger.error("Error during shutdown:", error);
        process.exit(1);
      }
    });
  }

  public MangiClient(apiId: number, apiHash: string, stringSession?: string) {
    const client = new TelegramClient(stringSession ?? "", apiId, apiHash, {
      connectionRetries: 5,
    });
    return client;
  }

  /**
   * Cleanup and disconnect from all services
   */
  public async cleanup(): Promise<void> {
    try {
      // Stop bot
      await this.botManager.stop();
      // Disconnect from Redis
      await this.redisManager.disconnect();
      logger.info("Bot cleanup completed successfully");
    } catch (error) {
      logger.error("Error during cleanup:", error);
      throw error;
    }
  }

  /**
   * Get the bot manager instance
   */
  public getBotManager() {
    return this.botManager;
  }
}

export { RedisManager } from "./database/RedisManager";
export { TelegramManager } from "./bot/BotClient";
export { CustomContext };
export { logger };

