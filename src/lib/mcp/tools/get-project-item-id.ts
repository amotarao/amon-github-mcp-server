import type { McpServer } from "mcp-handler";
import { z } from "zod";
import { makeGitHubGraphQLRequest } from "../../github/client";

export function registerGetProjectItemIdTool(
  server: McpServer,
  githubToken?: string,
) {
  server.tool(
    "get_project_item_id",
    "Get the Project V2 item ID for an issue in a specific project",
    {
      owner: z
        .string()
        .describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z.number().describe("Issue number"),
      project_id: z
        .string()
        .describe(
          "Project node ID (e.g., 'PVT_kwDOAbc123') - use list_projects_for_issue to find this",
        ),
    },
    async ({ owner, repo, issue_number, project_id }) => {
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
        const matchingItem = projectItems.find(
          (item: any) => item.project.id === project_id,
        );

        if (!matchingItem) {
          return {
            content: [
              {
                type: "text",
                text: `Issue #${issue_number} in ${owner}/${repo} is not associated with project ${project_id}.\n\nTip: Use list_projects_for_issue to see all projects this issue is associated with.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Issue #${issue_number} in ${owner}/${repo} has the following item in project "${matchingItem.project.title}":\n\n` +
                `- Project Item ID: ${matchingItem.id}\n` +
                `- Project ID: ${matchingItem.project.id}\n` +
                `- Project URL: ${matchingItem.project.url}`,
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
