import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram";
import * as input from "input";  // Use namespace import instead of default import

// Replace with your own api_id and api_hash (from https://my.telegram.org)
export const apiId = 20316022; // your api_id (number)
export const apiHash = "248e85787b42cd6d342ec0f725b38ebb"; // your api_hash (string)
let stringSession:any = new StringSession(""); // empty session string initially

async function createGroup(client: TelegramClient) {
    try {
        console.log("Creating group...");
        const result = await client.invoke(
            new Api.messages.CreateChat({
                users: ["username1", "username2"], // replace with valid usernames or IDs
                title: "My New Group",
            })
        );
        console.log("Group created:", result);
    } catch (error) {
        console.error("Error creating group:", error);
    }
}

async function createChannel(client: TelegramClient) {
    try {
        console.log("Creating channel...");
        const result = await client.invoke(
            new Api.channels.CreateChannel({
                broadcast: true,
                title: "My New Channel",
                about: "This channel is created programmatically using GramJS",
            })
        );
        console.log("Channel created:", result);
    } catch (error) {
        console.error("Error creating channel:", error);
    }
}

async function main() {
    console.log("Connecting to Telegram...");

    const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });
   
        await client.start({
            phoneNumber: async () => "+918877756207",            // Your phone number
            // password: async () => "your_2fa_password_here",    // If 2FA is enabled
            phoneCode: async () => {
                // ⚠️ You must still manually read the code from Telegram
                console.log("💬 Waiting for the code...");
                return await new Promise(resolve => {
                    // Simulate receiving code, e.g., from your own backend or wait for user input here
                    setTimeout(() => {
                        resolve("12345"); // Replace with real code (via UI, API, or file)
                    }, 10000);
                });
            },
            onError: (err) => console.log(err),
        });

     
    console.log("You are now connected!");

    stringSession = client.session
    console.log("My session",stringSession)
    // Create a group and a channel (uncomment as needed)
    // await createGroup(client);
    await createChannel(client);

    // Optionally, save the session string for future runs:
    // console.log("Your session string:", client.session.save());
    // await client.disconnect();
    console.log("Disconnected from Telegram.");
}

main();