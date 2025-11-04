import type { McpServer } from "@/types/mcp-server";
import { z } from "zod";
import { makeGitHubRequest } from "../../github/client";

export function registerGetIdsOfIssuesTool(
  server: McpServer,
  githubToken?: string,
) {
  server.tool(
    "get_ids_of_issues",
    "Get the internal GitHub issue IDs from multiple issue numbers. Supports batch processing for efficiency.",
    {
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      issue_numbers: z
        .array(z.number())
        .describe("Array of issue numbers to get the IDs for"),
    },
    async ({ owner, repo, issue_numbers }) => {
      if (!issue_numbers || issue_numbers.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Error: No issue numbers provided. Please provide at least one issue number.",
            },
          ],
        };
      }

      const results: string[] = [];
      const errors: string[] = [];

      for (const issue_number of issue_numbers) {
        try {
          const content = await makeGitHubRequest(
            `/repos/${owner}/${repo}/issues/${issue_number}`,
            githubToken,
          );

          results.push(`✓ Issue #${issue_number}: ID ${content.id}`);
        } catch (error) {
          if (error instanceof Error && error.message.includes("404")) {
            errors.push(`Issue #${issue_number}: Not found`);
          } else {
            errors.push(
              `Issue #${issue_number}: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalCount = issue_numbers.length;

      let summaryText = `Batch operation completed: ${successCount}/${totalCount} issue IDs retrieved successfully from ${owner}/${repo}`;

      if (results.length > 0) {
        summaryText += `\n\nSuccessful retrievals:\n${results.join("\n")}`;
      }

      if (errors.length > 0) {
        summaryText += `\n\nErrors encountered:\n${errors.join("\n")}`;
      }

      return {
        content: [
          {
            type: "text",
            text: summaryText,
          },
        ],
      };
    },
  );
}
