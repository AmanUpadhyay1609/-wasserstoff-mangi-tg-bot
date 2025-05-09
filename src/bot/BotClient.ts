import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram";
import * as input from "input";

export class TelegramManager {
    private client: TelegramClient;
    private stringSession: StringSession;
    private apiId: number;
    private apiHash: string;
    constructor(apiId: number, apiHash: string, session: string = "") {
        this.apiId = apiId;
        this.apiHash = apiHash;
        this.stringSession = new StringSession(session);
        this.client = new TelegramClient(this.stringSession, this.apiId, this.apiHash, { connectionRetries: 5 });
    }

    public async start(phone: string): Promise<void> {
        // If we already have a session, just connect; otherwise, start a new login
        if (this.stringSession.save() === "") {
            await this.client.start({
                phoneNumber: phone,
                phoneCode: async () => {
                    console.log("💬 Waiting for the code...");
                    return await input.text("Please enter the code you received: ");
                },
                onError: (err) => console.error(err),
            });
        } else {
            await this.client.connect();
        }
    }

    public async createGroup(users: string[], title: string): Promise<void> {
        try {
            console.log("Creating group...");
            const result = await this.client.invoke(
                new Api.messages.CreateChat({
                    users: users, // provide an array of valid usernames or IDs
                    title: title,
                })
            );
        } catch (error) {
            console.error("Error creating group:", error);
        }
    }

    public async createChannel(title: string, about: string): Promise<void> {
        try {
            console.log("Creating channel...");
            const result = await this.client.invoke(
                new Api.channels.CreateChannel({
                    broadcast: true, // true creates a channel; false creates a megagroup
                    title: title,
                    about: about,
                })
            );
        } catch (error) {
            console.error("Error creating channel:", error);
        }
    }

    public async disconnect(): Promise<void> {
        await this.client.disconnect();
        console.log("Disconnected from Telegram.");
    }

    public getSession(): string {
        return this.stringSession.save();
    }
}