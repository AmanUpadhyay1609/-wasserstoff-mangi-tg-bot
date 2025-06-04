import Redis from "ioredis";
import { createSdkLogger } from "../logger";

export class RedisManager {
    private static instance: RedisManager;
    private redisClient?: Redis;
    private sdkLogger: ReturnType<typeof createSdkLogger>;
    private isDev: boolean;

    private constructor(isDev: boolean = false) {
        this.isDev = isDev;
        this.sdkLogger = createSdkLogger(isDev);
    }

    public static getInstance(isDev: boolean = false): RedisManager {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager(isDev);
        }
        return RedisManager.instance;
    }

    public async connect(uri: string): Promise<void> {
        try {
            this.redisClient = new Redis(uri);

            this.redisClient.on("connect", () => {
                if (this.isDev) {
                    this.sdkLogger.info("Redis connected successfully");
                }
            });

            this.redisClient.on("error", (err) => {
                if (this.isDev) {
                    this.sdkLogger.error("Redis connection error:", err);
                }
            });

            this.redisClient.on("close", () => {
                if (this.isDev) {
                    this.sdkLogger.info("Redis connection closed");
                }
            });

            // Test the connection
            await this.redisClient.ping();
        } catch (error) {
            if (this.isDev) {
                this.sdkLogger.error("Error connecting to Redis:", error);
            }
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            if (this.redisClient) {
                await this.redisClient.quit();
                if (this.isDev) {
                    this.sdkLogger.info("Redis disconnected successfully");
                }
            }
        } catch (error) {
            if (this.isDev) {
                this.sdkLogger.error("Error disconnecting from Redis:", error);
            }
            throw error;
        }
    }

    public getClient(): Redis {
        if (!this.redisClient) {
            throw new Error("Redis client not initialized. Call connect(uri) first.");
        }
        return this.redisClient;
    }
} 