import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram";
import * as input from "input";
import BigInteger from 'node-biginteger'

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

    public async getClient() {
        return this.client;
    }

    public async start(phone: string): Promise<any> {
        return await this.client.start({
            phoneNumber: phone,
            phoneCode: async () => {
                return await input.text("Please enter the code you received: ");
            },
            onError: (err) => console.error(err),
        });

    }

    public async connect() {
        return await this.client.connect();
    }

    public async createGroup(users: string[], title: string): Promise<Api.messages.InvitedUsers> {
        try {
            const result = await this.client.invoke(
                new Api.messages.CreateChat({
                    users: users, // provide an array of valid usernames or IDs
                    title: title,
                })
            );
            return result;
        } catch (error) {
            console.error("Error creating group:", error);
        }
    }

    public async createChannel(title: string, about: string): Promise<any> {
        try {
            const result = await this.client.invoke(
                new Api.channels.CreateChannel({
                    broadcast: true, // true creates a channel; false creates a megagroup
                    title: title,
                    about: about,
                })
            );
            return result;
        } catch (error) {
            console.error("Error creating channel:", error);
        }
    }

    public async addUserToGroup(chatId: number, userId: string): Promise<any> {
        try {
            const inputUser = await this.client.getInputEntity(userId);
            const result = await this.client.invoke(
                new Api.messages.AddChatUser({
                    chatId: BigInteger(chatId),
                    userId: inputUser,
                    fwdLimit: 0, // 0 means no history is shared
                })
            );

            return result;
        } catch (error) {
            console.error("Error adding user to group:", error);
        }
    }

    public async disconnect(): Promise<void> {
        await this.client.disconnect();
    }

    public getSession(): string {
        return this.stringSession.save();
    }
}