import { google } from "@ai-sdk/google";
import { CoreMessage, streamText } from "ai";
import dotenv from "dotenv";
import * as readline from "node:readline/promises";
 
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
 
    // streamText 関数はストリーミングで応答を生成する
    const result = streamText({
      // AI モデルを指定
      // 引数で最新のモデルを指定している
      model: google("gemini-2.5-pro-exp-03-25"),
      messages,
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
