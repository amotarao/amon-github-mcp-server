import type { McpServer } from "mcp-handler";
import { z } from "zod";
import { GITHUB_API_BASE, USER_AGENT } from "../../github/client";

export function registerRemoveSubIssuesTool(
  server: McpServer,
  githubToken?: string,
) {
  server.tool(
    "remove_sub_issues",
    "Remove multiple sub-issues from a GitHub issue using GitHub Sub-Issues API. Supports batch processing for efficiency.",
    {
      owner: z
        .string()
        .describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z
        .number()
        .describe("Parent issue number to remove sub-issues from"),
      sub_issue_ids: z
        .array(z.number())
        .describe(
          "Array of sub-issue IDs to remove from the parent issue. These must be internal GitHub issue IDs, not issue numbers.",
        ),
    },
    async ({ owner, repo, issue_number, sub_issue_ids }) => {
      if (!sub_issue_ids || sub_issue_ids.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Error: No sub-issue IDs provided. Please provide at least one sub-issue ID.",
            },
          ],
        };
      }

      const results: string[] = [];
      const errors: string[] = [];

      for (const sub_issue_id of sub_issue_ids) {
        try {
          const requestBody = {
            sub_issue_id,
          };

          const response = await fetch(
            `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issue_number}/sub_issue`,
            {
              method: "DELETE",
              headers: {
                "User-Agent": USER_AGENT,
                Accept: "application/vnd.github.v3+json",
                Authorization: `token ${githubToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            },
          );

          if (!response.ok) {
            const errorText = await response.text();
            errors.push(
              `Sub-issue ID ${sub_issue_id}: ${response.status} ${response.statusText} - ${errorText}`,
            );
          } else {
            results.push(
              `✓ Successfully removed sub-issue ID ${sub_issue_id} from issue #${issue_number}`,
            );
          }
        } catch (error) {
          errors.push(
            `Sub-issue ID ${sub_issue_id}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalCount = sub_issue_ids.length;

      let summaryText = `Batch operation completed: ${successCount}/${totalCount} sub-issues removed successfully from issue #${issue_number} in ${owner}/${repo}`;

      if (results.length > 0) {
        summaryText += `\n\nSuccessful removals:\n${results.join("\n")}`;
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
