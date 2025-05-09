import { onShutdown } from "node-graceful-shutdown";
import { logger } from "./logger";
import { BotManager } from "./bot/BotManager";
import { DatabaseManager } from "./database/DatabaseManager";
import { RedisManager } from "./database/RedisManager";
import { TelegramClient } from "telegram";

export interface AppConfig {
  mongodbUri: string;
  botToken: string;
  botMode: string;
  botWebhookUrl?: string;
  botAllowedUpdates: string[];
  redisUrl: string;
  isDev: boolean;
  useAuth?: "fully" | "partial" | "none"; // New option for authentication
  jwtSecret?: string; // Secret for JWT signing
}

export class Bot {
  private botManager: BotManager;
  private databaseManager: DatabaseManager;
  private redisManager: RedisManager;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.redisManager = RedisManager.getInstance();
    this.databaseManager = DatabaseManager.getInstance();
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

      // Connect to database
      await this.databaseManager.connect(this.config.mongodbUri);

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

  /**
   * Get the MongoDB connection
   */
  public getMongoConnection() {
    return this.databaseManager.getMongoConnection();
  }

  /**
   * Get the bot manager instance
   */
  public getBotManager() {
    return this.botManager;
  }

  private setupShutdown(): void {
    onShutdown(async () => {
      logger.info("Initiating graceful shutdown...");

      try {
        // Stop bot
        await this.botManager.stop();

        // Disconnect from database
        await this.databaseManager.disconnect();

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

      // Disconnect from database
      await this.databaseManager.disconnect();

      // Disconnect from Redis
      await this.redisManager.disconnect();

      logger.info("Bot cleanup completed successfully");
    } catch (error) {
      logger.error("Error during cleanup:", error);
      throw error;
    }
  }
}

// Export the Bot class and types
export { BotManager } from "./bot/BotManager";
export { DatabaseManager } from "./database/DatabaseManager";
export { RedisManager } from "./database/RedisManager";
export { TelegramManager } from "./bot/BotClient";

// // // Start the application if this file is run directly
// if (require.main === module) {
//   const app = new Bot({
//     mongodbUri: config.MONGO_URL,
//     botToken: config.BOT_TOKEN,
//     botMode: config.BOT_MODE,
//     botWebhookUrl: config.BOT_WEBHOOK_URL,
//     redisUrl: config.REDIS_URL,
//     isDev: true,
//     botAllowedUpdates: config.BOT_ALLOWED_UPDATES as string[]
//   });

//   app.initialize().catch((error) => {
//     logger.error("Fatal error:", error);
//     process.exit(1);
//   });
// }
