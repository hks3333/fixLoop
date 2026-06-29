import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';

// Lazily initialised — safe to import even when env vars are not set
let _app: App | null = null;

function getApp(): App {
  if (!_app) {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!appId || !privateKey || !secret) {
      throw new Error(
        'GitHub App not configured. Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_WEBHOOK_SECRET in .env.local.'
      );
    }

    _app = new App({
      appId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      webhooks: { secret },
    });
  }
  return _app;
}

export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  const app = getApp();
  // @octokit/app returns an Octokit instance compatible with @octokit/rest
  return app.getInstallationOctokit(installationId) as unknown as Octokit;
}

export async function postPRComment(params: {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  body: string;
}): Promise<void> {
  const octokit = await getInstallationOctokit(params.installationId);
  await (octokit as any).issues.createComment({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.prNumber,
    body: params.body,
  });
}

export async function openFixPR(params: {
  installationId: number;
  owner: string;
  repo: string;
  baseBranch: string;
  fixBranchName: string;
  filePath: string;
  oldContent: string;
  newContent: string;
  commitMessage: string;
  prTitle: string;
  prBody: string;
}): Promise<string> {
  const octokit = await getInstallationOctokit(params.installationId) as any;

  // Get the base branch SHA
  const { data: ref } = await octokit.git.getRef({
    owner: params.owner,
    repo: params.repo,
    ref: `heads/${params.baseBranch}`,
  });
  const baseSha = ref.object.sha;

  // Create fix branch
  await octokit.git.createRef({
    owner: params.owner,
    repo: params.repo,
    ref: `refs/heads/${params.fixBranchName}`,
    sha: baseSha,
  });

  // Get current file SHA on the new branch
  const { data: fileData } = await octokit.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: params.filePath,
    ref: params.fixBranchName,
  });

  // Update the file
  await octokit.repos.createOrUpdateFileContents({
    owner: params.owner,
    repo: params.repo,
    path: params.filePath,
    message: params.commitMessage,
    content: Buffer.from(params.newContent).toString('base64'),
    sha: (fileData as any).sha,
    branch: params.fixBranchName,
  });

  // Open the PR
  const { data: pr } = await octokit.pulls.create({
    owner: params.owner,
    repo: params.repo,
    title: params.prTitle,
    body: params.prBody,
    head: params.fixBranchName,
    base: params.baseBranch,
  });

  return pr.html_url;
}

export function getPreviewUrl(branchName: string): string {
  const pattern = process.env.VERCEL_PREVIEW_PATTERN || '';
  if (!pattern) return process.env.TARGET_PRODUCTION_URL || 'http://localhost:3000';

  // Vercel slugifies branch names: feature/my-branch → feature-my-branch
  const slug = branchName
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return pattern.replace('{branch}', slug);
}

export { getApp as app };
