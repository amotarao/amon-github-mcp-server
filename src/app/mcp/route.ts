import { createMcpHandler } from "mcp-handler";
import {
  registerAddSubIssuesTool,
  registerGetIdOfIssueTool,
  registerGetIdsOfIssuesTool,
  registerGetParentOfSubIssueTool,
  registerGetProjectItemIdTool,
  registerListProjectsForIssueTool,
  registerListSubIssuesTool,
  registerRemoveSubIssuesTool,
  registerSetMilestoneForIssuesTool,
} from "@/lib/mcp";

const handler = async (request: Request) => {
  const githubTokenHeader = request.headers.get("X-GITHUB-TOKEN");
  const githubToken = Array.isArray(githubTokenHeader)
    ? githubTokenHeader[0]
    : githubTokenHeader || undefined;

  const mcpHandler = createMcpHandler(
    (server) => {
      registerGetParentOfSubIssueTool(server, githubToken);
      registerListSubIssuesTool(server, githubToken);
      registerGetIdOfIssueTool(server, githubToken);
      registerGetIdsOfIssuesTool(server, githubToken);
      registerAddSubIssuesTool(server, githubToken);
      registerRemoveSubIssuesTool(server, githubToken);
      registerSetMilestoneForIssuesTool(server, githubToken);
      registerListProjectsForIssueTool(server, githubToken);
      registerGetProjectItemIdTool(server, githubToken);
    },
    {
      serverInfo: {
        name: "GitHub MCP Server",
        version: "1.0.0",
      },
    },
    {
      verboseLogs: true,
    },
  );

  return mcpHandler(request);
};

export { handler as DELETE, handler as GET, handler as POST };
