// import * as http from "http";
// import * as fs from "fs";
// import * as path from "path";
// import { Bot } from "grammy";
// import { logger } from "../logger";

// export class Server {
//     private httpServer: http.Server;
//     private bot: Bot;

//     constructor(bot: Bot) {
//         this.bot = bot;
//         this.httpServer = http.createServer((req, res) => {
//             this.serveStaticFile(req, res);
//         });
//     }

//     private serveStaticFile(req: http.IncomingMessage, res: http.ServerResponse): void {
//         if (req.url && req.url.startsWith("/public/")) {
//             const imagePath = path.join(__dirname, "..", "..", req.url);
//             fs.readFile(imagePath, (err, data) => {
//                 if (err) {
//                     res.writeHead(404, { "Content-Type": "text/plain" });
//                     res.end("File not found");
//                 } else {
//                     const contentType = this.getContentType(imagePath);
//                     res.writeHead(200, { "Content-Type": contentType });
//                     res.end(data);
//                 }
//             });
//         } else {
//             res.writeHead(404, { "Content-Type": "text/plain" });
//             res.end("Page not found");
//         }
//     }

//     private getContentType(filePath: string): string {
//         const extname = path.extname(filePath).toLowerCase();
//         switch (extname) {
//             case ".png":
//                 return "image/png";
//             case ".jpg":
//             case ".jpeg":
//                 return "image/jpeg";
//             case ".gif":
//                 return "image/gif";
//             default:
//                 return "application/octet-stream";
//         }
//     }

//     public async start(): Promise<void> {
//         return new Promise((resolve) => {
//             this.httpServer.listen(config.HTTP_SERVER_PORT, () => {
//                 logger.info({
//                     msg: "Server is listening...",
//                     host: config.HTTP_SERVER_HOST,
//                     port: config.HTTP_SERVER_PORT,
//                 });
//                 resolve();
//             });
//         });
//     }

//     public async stop(): Promise<void> {
//         return new Promise((resolve) => {
//             this.httpServer.close(() => {
//                 logger.info("HTTP server stopped");
//                 resolve();
//             });
//         });
//     }
// } 