import Redis from "ioredis";
import { logger } from "../logger";

export class RedisManager {
    private static instance: RedisManager;
    private redisClient: Redis;

    private constructor() {
        this.redisClient = new Redis();
    }

    public static getInstance(): RedisManager {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager();
        }
        return RedisManager.instance;
    }

    public async connect(uri: string): Promise<void> {
        try {
            this.redisClient = new Redis(uri);

            this.redisClient.on("connect", () => {
                logger.info("Redis connected successfully");
            });

            this.redisClient.on("error", (err) => {
                logger.error("Redis connection error:", err);
            });

            this.redisClient.on("close", () => {
                logger.info("Redis connection closed");
            });

            // Test the connection
            await this.redisClient.ping();
        } catch (error) {
            logger.error("Error connecting to Redis:", error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await this.redisClient.quit();
            logger.info("Redis disconnected successfully");
        } catch (error) {
            logger.error("Error disconnecting from Redis:", error);
            throw error;
        }
    }

    public getClient(): Redis {
        return this.redisClient;
    }
} 