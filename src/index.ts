// import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { CoreMessage, streamText } from "ai";
import dotenv from "dotenv";
import * as readline from "node:readline/promises";

import { experimental_createMCPClient as createMCPClient } from "ai";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai/mcp-stdio";

import { systemPrompt } from "./prompts/system.js";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  // Foreground colors
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m"
  },
  
  // Background colors
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m"
  }
};

// Load environment variables from .env file
dotenv.config();

// Verify required environment variables
function checkEnvironmentVariables() {
  const requiredVars = ['ANTHROPIC_API_KEY']; // Add any required env vars
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Initialize MCP client
async function initializeMCPClient() {
  const current_dir = process.cwd();
  const dirname = new URL('.', import.meta.url).pathname;

  return await createMCPClient({
    transport: new StdioMCPTransport({
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        dirname, // Directory with read/write permissions
        current_dir
      ],
    }),
  });
}

// Create terminal interface for user interaction
function createTerminalInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Handle user input
async function getUserInput(terminal: readline.Interface) {
  const userInput = await terminal.question(`${colors.fg.green}${colors.bright}You: ${colors.reset}`);

  // Check for exit commands
  if (userInput.toLowerCase() === "exit" || userInput.toLowerCase() === "quit") {
    return { shouldExit: true, input: "" };
  }

  return { shouldExit: false, input: userInput };
}

// Process AI response
async function processAIResponse(terminal: readline.Interface, messages: CoreMessage[], mcpClient: any) {
  const tools = await mcpClient.tools();

  const result = streamText({
    model: anthropic("claude-3-7-sonnet-latest"),
    messages,
    tools,
    maxSteps: 20,
    onStepFinish: (step: any) => {
      console.log("\n\n");
    },
  });

  let fullResponse = "";

  terminal.write(`\n${colors.fg.blue}${colors.bright}Assistant: ${colors.reset}`);

  try {
    for await (const delta of result.textStream) {
      fullResponse += delta;
      terminal.write(delta);
    }
    terminal.write("\n\n");

    return fullResponse;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    terminal.write(`\nError generating response: ${errorMessage}\n\n`);
    return `Error: ${errorMessage}`;
  }
}

// Clean up resources
function shutdown(mcpClient: any, terminal: readline.Interface) {
  if (terminal) terminal.close();
  if (mcpClient) mcpClient.close();
  process.exit(0);
}

// Main function
async function main() {
  try {
    // Check environment variables
    checkEnvironmentVariables();

    // Initialize resources
    const mcpClient = await initializeMCPClient();
    const terminal = createTerminalInterface();
    const messages: CoreMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Set up shutdown handlers
    process.on("SIGINT", () => shutdown(mcpClient, terminal));
    process.on("SIGTERM", () => shutdown(mcpClient, terminal));

    // Main conversation loop
    while (true) {
      // Get user input
      const { shouldExit, input } = await getUserInput(terminal);

      if (shouldExit) {
        terminal.write("Goodbye!\n");
        shutdown(mcpClient, terminal);
        return;
      }

      if (!input.trim()) {
        terminal.write("Please enter a message.\n");
        continue;
      }

      // Add user message to history
      messages.push({ role: "user", content: input });

      // Process AI response
      const response = await processAIResponse(terminal, messages, mcpClient);

      // Add AI response to history
      messages.push({ role: "assistant", content: response });
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
