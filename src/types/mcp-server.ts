import { createMcpHandler } from "mcp-handler";

export type McpServer = Parameters<Parameters<typeof createMcpHandler>[0]>[0];
