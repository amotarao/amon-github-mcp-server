const GITHUB_API_BASE = "https://api.github.com";
const USER_AGENT = "GitHub-MCP-Server/1.0.0";

export async function makeGitHubRequest(
  endpoint: string,
  githubToken?: string,
): Promise<any> {
  const url = `${GITHUB_API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/vnd.github.v3+json",
  };

  if (githubToken) {
    headers["Authorization"] = `token ${githubToken}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function makeGitHubGraphQLRequest(
  query: string,
  variables: Record<string, any>,
  githubToken?: string,
): Promise<any> {
  const url = "https://api.github.com/graphql";

  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "Content-Type": "application/json",
  };

  if (githubToken) {
    headers["Authorization"] = `bearer ${githubToken}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub GraphQL API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

export { GITHUB_API_BASE, USER_AGENT };
