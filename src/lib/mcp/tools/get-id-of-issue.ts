import type { McpServer } from "@/types/mcp-server";
import { z } from "zod";
import { makeGitHubRequest } from "../../github/client";

export function registerGetIdOfIssueTool(
  server: McpServer,
  githubToken?: string,
) {
  server.tool(
    "get_id_of_issue",
    "Get the internal GitHub issue ID from an issue number",
    {
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z.number().describe("Issue number to get the ID for"),
    },
    async ({ owner, repo, issue_number }) => {
      try {
        const content = await makeGitHubRequest(
          `/repos/${owner}/${repo}/issues/${issue_number}`,
          githubToken,
        );

        return {
          content: [
            {
              type: "text",
              text: `Issue #${issue_number} in ${owner}/${repo} has ID: ${content.id}`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          return {
            content: [
              {
                type: "text",
                text: `Issue #${issue_number} not found in ${owner}/${repo}.`,
              },
            ],
          };
        }
        throw error;
      }
    },
  );
}
