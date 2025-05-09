import { TelegramManager } from "../bot/BotClient";

// Use your API credentials here

const apiId = 12;
const apiHash = "";

// Optionally, load session data from file or use an empty session string.
const sessionData = "";

async function main() {
    const telegramManager = new TelegramManager(apiId, apiHash, sessionData);

    await telegramManager.start("+91 887xxxxx");

    // Uncomment any of these operations as needed.
    await telegramManager.createGroup(["username1", "username2"], "My New Group");
    await telegramManager.createChannel("My New Channel", "This channel is created programmatically using GramJS");

    console.log("Session:", telegramManager.getSession());

}

main();