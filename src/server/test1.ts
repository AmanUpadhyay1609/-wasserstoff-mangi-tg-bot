import { TelegramManager } from "../bot/BotClient";

// Replace these with your actual API credentials
const apiId = 203; // Your API ID
const apiHash = "248e85787b42cd6d...."; // Your API Hash

// Optionally, provide an existing session string (empty string means a new login)
const sessionData = "";

async function main() {
    // Create an instance of TelegramManager
    const telegramManager = new TelegramManager(apiId, apiHash, sessionData);

    // Start a new connection (if session is empty, it will log in using the provided phone number)
    await telegramManager.start("+91 887xxxxx");

    // Uncomment below if you prefer to use connect() when a session already exists
    // await telegramManager.connect();

    // Create a new group with an array of usernames (or user IDs)
    await telegramManager.createGroup(["username1", "username2"], "My New Group");

    // Add a user to the group:
    // Note: Replace 123456789 with the chat ID of the group returned from createGroup
    await telegramManager.addUserToGroup(12349, "username3");

    const peer = "@"; // Replace with a valid peer

    // Define the poll question and its options.
    const question = "What is your favorite programming language?";
    const options = ["TypeScript", "JavaScript", "Python", "Other"];

    // Log the current session so you can reuse it later
    console.log("Session:", telegramManager.getSession());

    // Disconnect from Telegram once done
    await telegramManager.disconnect();
}

main();