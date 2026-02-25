import { Injectable } from "@nestjs/common";
import { GitProvider, GitResourceInput } from "./git-provider";

@Injectable()
export class LinkOnlyGitProvider implements GitProvider {
  async resolveResource(input: GitResourceInput) {
    return {
      url: input.url
    };
  }
}
