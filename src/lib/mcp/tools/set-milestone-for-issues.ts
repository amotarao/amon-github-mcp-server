import type { McpServer } from "mcp-handler";
import { z } from "zod";
import { GITHUB_API_BASE, USER_AGENT } from "../../github/client";

export function registerSetMilestoneForIssuesTool(
  server: McpServer,
  githubToken?: string,
) {
  server.tool(
    "set_milestone_for_issues",
    "Set milestone for multiple GitHub issues. Supports batch processing for efficiency.",
    {
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      issue_numbers: z
        .array(z.number())
        .describe("Array of issue numbers to update"),
      milestone_number: z
        .number()
        .nullable()
        .describe(
          "Milestone number to set, or null to remove milestone from issues",
        ),
    },
    async ({ owner, repo, issue_numbers, milestone_number }) => {
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
          const response = await fetch(
            `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issue_number}`,
            {
              method: "PATCH",
              headers: {
                "User-Agent": USER_AGENT,
                Accept: "application/vnd.github.v3+json",
                Authorization: `token ${githubToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ milestone: milestone_number }),
            },
          );

          if (!response.ok) {
            const errorText = await response.text();
            errors.push(
              `Issue #${issue_number}: ${response.status} ${response.statusText} - ${errorText}`,
            );
          } else {
            const result = await response.json();
            const milestoneText =
              milestone_number === null
                ? "Removed milestone"
                : result.milestone
                  ? `Set milestone to "${result.milestone.title}" (milestone #${milestone_number})`
                  : `Set milestone #${milestone_number}`;
            results.push(`✓ Issue #${issue_number}: ${milestoneText}`);
          }
        } catch (error) {
          errors.push(
            `Issue #${issue_number}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalCount = issue_numbers.length;

      let summaryText = `Batch operation completed: ${successCount}/${totalCount} issues updated successfully in ${owner}/${repo}`;

      if (results.length > 0) {
        summaryText += `\n\nSuccessful updates:\n${results.join("\n")}`;
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
