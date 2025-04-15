// import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { CoreMessage, streamText } from "ai";
import dotenv from "dotenv";
import * as readline from "node:readline/promises";

import { experimental_createMCPClient as createMCPClient } from "ai";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai/mcp-stdio";

const current_dir = process.cwd();
 
const mcpClient = await createMCPClient({
  transport: new StdioMCPTransport({
    command: "npx",
    args: [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      import.meta.dirname, // ここには読み書きを許可するディレクトリを指定
      current_dir
    ],
  }),
});


process.on("SIGINT", () => {
  mcpClient.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  mcpClient.close();
  process.exit(0);
});
 
// 環境変数を .env ファイルから読み込む
dotenv.config();
 
// 標準出力と標準入力を使用して、ユーザーとの対話を行うためのインターフェースを作成
const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
 
const messages: CoreMessage[] = [];
 
async function main() {
  while (true) {
    // ユーザーからの入力を待機
    const userInput = await terminal.question("You: ");
 
    // ユーザー入力をチャットの履歴として追加
    messages.push({ role: "user", content: userInput });
 
    const tools = await mcpClient.tools();
    // streamText 関数はストリーミングで応答を生成する
    const result = streamText({
      // AI モデルを指定
      // 引数で最新のモデルを指定している
      // model: google("gemini-2.5-pro-exp-03-25"),
      model: anthropic("claude-3-opus-20240229"),
      messages,
      tools,
      maxSteps: 5
    });
 
    let fullResponse = "";
 
    terminal.write("\nAssistant: ");
    // ストリーミングをチャンクごとに処理
    for await (const delta of result.textStream) {
      fullResponse += delta;
      // 受信したチャンクを標準出力に書き込む
      terminal.write(delta);
    }
    terminal.write("\n\n");
 
    // チャットの履歴に AI の応答を追加
    messages.push({ role: "assistant", content: fullResponse });
  }
}
 
main().catch(console.error);
