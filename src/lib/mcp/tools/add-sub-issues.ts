import type { McpServer } from "@/types/mcp-server";
import { z } from "zod";
import { GITHUB_API_BASE, USER_AGENT } from "../../github/client";

export function registerAddSubIssuesTool(
  server: McpServer,
  githubToken?: string,
) {
  server.tool(
    "add_sub_issues",
    "Add multiple sub-issues to a GitHub issue using GitHub Sub-Issues API. Supports batch processing for efficiency.",
    {
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z
        .number()
        .describe("Parent issue number to add sub-issues to"),
      sub_issue_ids: z
        .array(z.number())
        .describe(
          "Array of sub-issue IDs to add to the parent issue. These must be internal GitHub issue IDs, not issue numbers.",
        ),
      replace_parent: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "When true, replaces the current parent issue for each sub-issue",
        ),
    },
    async ({ owner, repo, issue_number, sub_issue_ids, replace_parent }) => {
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
            ...(replace_parent && { replace_parent }),
          };

          const response = await fetch(
            `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issue_number}/sub_issues`,
            {
              method: "POST",
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
            const result = await response.json();
            results.push(
              `✓ Successfully added sub-issue ID ${sub_issue_id} to issue #${issue_number}`,
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

      let summaryText = `Batch operation completed: ${successCount}/${totalCount} sub-issues added successfully to issue #${issue_number} in ${owner}/${repo}`;

      if (results.length > 0) {
        summaryText += `\n\nSuccessful additions:\n${results.join("\n")}`;
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
