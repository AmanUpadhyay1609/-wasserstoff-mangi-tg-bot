import { TelegramManager } from "../bot/BotClient";


export const apiId = 20316022; 
export const apiHash = "248e85787b42cd6d342ec0f725b38ebb";

const sessionData = "";

async function main() {
    const telegramManager = new TelegramManager(apiId, apiHash, sessionData);

    // telegramManager.connect();
    await telegramManager.start("+91 887xxxxx");

    // Uncomment any of these operations as needed.
    await telegramManager.createGroup(["username1", "username2"], "My New Group");
    await telegramManager.createChannel("My New Channel", "This channel is created programmatically using GramJS");

    console.log("Session:", telegramManager.getSession());

}

main();