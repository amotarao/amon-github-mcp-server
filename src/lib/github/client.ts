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

export { GITHUB_API_BASE, USER_AGENT };
