export type GitResourceInput = {
  url: string;
};

export type GitResourceDetails = {
  url: string;
  title?: string;
  author?: string;
  status?: string;
};

export interface GitProvider {
  resolveResource(input: GitResourceInput): Promise<GitResourceDetails>;
}

export const GIT_PROVIDER = "GIT_PROVIDER";
