import mongoose from "mongoose";
import { logger } from "../logger";

export class DatabaseManager {
    private static instance: DatabaseManager;
    private mongoConnection: mongoose.Connection;

    private constructor() {
        this.mongoConnection = mongoose.connection;
        this.setupMongoEventListeners();
    }

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    private setupMongoEventListeners(): void {
        this.mongoConnection.on("connected", () => {
            logger.info("Mongoose connected to MongoDB");
        });

        this.mongoConnection.on("error", (err) => {
            logger.error("Mongoose connection error:", err);
        });

        this.mongoConnection.on("disconnected", () => {
            logger.info("Mongoose disconnected from MongoDB");
        });
    }

    public async connect(uri: string): Promise<void> {
        try {
            await mongoose.connect(uri, {
                serverApi: {
                    version: "1",
                },
            });
        } catch (error) {
            logger.error("Error connecting to MongoDB:", error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await mongoose.disconnect();
            logger.info("MongoDB disconnected successfully");
        } catch (error) {
            logger.error("Error disconnecting from MongoDB:", error);
            throw error;
        }
    }

    public getMongoConnection(): mongoose.Connection {
        return this.mongoConnection;
    }
} 