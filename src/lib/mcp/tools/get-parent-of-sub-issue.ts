import type { McpServer } from "mcp-handler";
import { z } from "zod";
import { makeGitHubRequest } from "../../github/client";

export function registerGetParentOfSubIssueTool(
  server: McpServer,
  githubToken?: string,
) {
  server.tool(
    "get_parent_of_sub_issue",
    "Get the parent issue of a sub-issue using GitHub Sub-Issues API",
    {
      owner: z
        .string()
        .describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z
        .number()
        .describe("Sub-issue number to get parent for"),
    },
    async ({ owner, repo, issue_number }) => {
      try {
        const content = await makeGitHubRequest(
          `/repos/${owner}/${repo}/issues/${issue_number}/parent`,
          githubToken,
        );

        return {
          content: [
            {
              type: "text",
              text: `Parent Issue for #${issue_number}:
Issue #${content.number}: ${content.title}
State: ${content.state}
Author: ${content.user.login}
Created: ${content.created_at}
Updated: ${content.updated_at}
URL: ${content.html_url}

Description:
${content.body || "No description"}`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          return {
            content: [
              {
                type: "text",
                text: `Issue #${issue_number} in ${owner}/${repo} does not have a parent issue or does not exist.`,
              },
            ],
          };
        }
        throw error;
      }
    },
  );
}
