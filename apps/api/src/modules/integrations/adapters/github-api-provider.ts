import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GitProvider, GitResourceInput } from "./git-provider";

@Injectable()
export class GitHubApiProvider implements GitProvider {
  constructor(private readonly config: ConfigService) {}

  async resolveResource(input: GitResourceInput) {
    const token = this.config.get<string>("GITHUB_TOKEN");
    if (!token) {
      return {
        url: input.url,
        status: "missing_token"
      };
    }

    // Placeholder enrichment strategy for scaffolding. The URL is preserved and marked enriched.
    return {
      url: input.url,
      status: "enriched",
      author: "github-api",
      title: "Metadata fetch implemented in later phase"
    };
  }
}
