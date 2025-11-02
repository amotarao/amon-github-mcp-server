import type { McpServer } from "mcp-handler";
import { z } from "zod";
import { makeGitHubGraphQLRequest } from "../../github/client";

export function registerListProjectsForIssueTool(
  server: McpServer,
  githubToken?: string,
) {
  server.tool(
    "list_projects_for_issue",
    "List all GitHub Projects V2 associated with an issue",
    {
      owner: z
        .string()
        .describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z
        .number()
        .describe("Issue number to get associated projects for"),
    },
    async ({ owner, repo, issue_number }) => {
      if (!githubToken) {
        return {
          content: [
            {
              type: "text",
              text: "Error: GitHub token is required for Projects V2 API access. Please provide X-GITHUB-TOKEN header.",
            },
          ],
        };
      }

      try {
        const query = `
          query($owner: String!, $repo: String!, $issueNumber: Int!) {
            repository(owner: $owner, name: $repo) {
              issue(number: $issueNumber) {
                projectItems(first: 100) {
                  nodes {
                    id
                    project {
                      id
                      title
                      url
                      number
                    }
                  }
                }
              }
            }
          }
        `;

        const variables = {
          owner,
          repo,
          issueNumber: issue_number,
        };

        const data = await makeGitHubGraphQLRequest(
          query,
          variables,
          githubToken,
        );

        if (!data.repository?.issue) {
          return {
            content: [
              {
                type: "text",
                text: `Issue #${issue_number} not found in ${owner}/${repo}.`,
              },
            ],
          };
        }

        const projectItems = data.repository.issue.projectItems.nodes;

        if (projectItems.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Issue #${issue_number} in ${owner}/${repo} is not associated with any Projects.`,
              },
            ],
          };
        }

        const projectList = projectItems
          .map(
            (item: any) =>
              `- **${item.project.title}** (Project #${item.project.number})\n` +
              `  - Project ID: ${item.project.id}\n` +
              `  - Project Item ID: ${item.id}\n` +
              `  - URL: ${item.project.url}`,
          )
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Issue #${issue_number} in ${owner}/${repo} is associated with ${projectItems.length} project(s):\n\n${projectList}`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`,
              },
            ],
          };
        }
        throw error;
      }
    },
  );
}
