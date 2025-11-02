import type { McpServer } from "@/types/mcp-server";
import { z } from "zod";
import { makeGitHubRequest } from "../../github/client";

export function registerListSubIssuesTool(
  server: McpServer,
  githubToken?: string,
) {
  server.tool(
    "list_sub_issues",
    "List sub-issues for a GitHub issue with pagination and filtering support",
    {
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z
        .number()
        .describe("Parent issue number to list sub-issues for"),
      per_page: z
        .number()
        .optional()
        .default(30)
        .describe("Number of results per page (max 100)"),
      page: z
        .number()
        .optional()
        .default(1)
        .describe("Page number of results to fetch"),
      state: z
        .enum(["open", "closed", "all"])
        .optional()
        .describe("Filter sub-issues by state"),
      labels: z
        .string()
        .optional()
        .describe("Comma-separated list of label names to filter by"),
    },
    async ({ owner, repo, issue_number, per_page, page, state, labels }) => {
      try {
        let endpoint = `/repos/${owner}/${repo}/issues/${issue_number}/sub_issues?per_page=${per_page}&page=${page}`;

        if (state) {
          endpoint += `&state=${state}`;
        }
        if (labels) {
          endpoint += `&labels=${encodeURIComponent(labels)}`;
        }

        const content = await makeGitHubRequest(endpoint, githubToken);

        if (!Array.isArray(content) || content.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No sub-issues found for issue #${issue_number} in ${owner}/${repo}.`,
              },
            ],
          };
        }

        const subIssuesList = content
          .map(
            (issue: any) =>
              `#${issue.number}: ${issue.title} (${issue.state}) - ${issue.html_url}`,
          )
          .join("\n");

        const totalText =
          content.length === per_page ? ` (showing page ${page})` : "";

        return {
          content: [
            {
              type: "text",
              text: `Sub-issues for #${issue_number} in ${owner}/${repo}${totalText}:\n\n${subIssuesList}`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          return {
            content: [
              {
                type: "text",
                text: `Issue #${issue_number} in ${owner}/${repo} does not exist or has no sub-issues.`,
              },
            ],
          };
        }
        throw error;
      }
    },
  );
}
