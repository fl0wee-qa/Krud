import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GIT_PROVIDER } from "./adapters/git-provider";
import { GitHubApiProvider } from "./adapters/github-api-provider";
import { LinkOnlyGitProvider } from "./adapters/link-only-git-provider";
import { MockSlackNotifier } from "./adapters/mock-slack-notifier";
import { SLACK_NOTIFIER } from "./adapters/slack-notifier";
import { WebhookSlackNotifier } from "./adapters/webhook-slack-notifier";
import { IntegrationsController } from "./integrations.controller";
import { IntegrationsService } from "./integrations.service";

@Module({
  controllers: [
    IntegrationsController
  ],
  providers: [
    IntegrationsService,
    MockSlackNotifier,
    WebhookSlackNotifier,
    LinkOnlyGitProvider,
    GitHubApiProvider,
    {
      provide: SLACK_NOTIFIER,
      inject: [
        ConfigService,
        MockSlackNotifier,
        WebhookSlackNotifier
      ],
      useFactory: (
        config: ConfigService,
        mockNotifier: MockSlackNotifier,
        webhookNotifier: WebhookSlackNotifier
      ) => {
        const mode = config.get<string>("SLACK_MODE", "mock");
        return mode === "webhook" ? webhookNotifier : mockNotifier;
      }
    },
    {
      provide: GIT_PROVIDER,
      inject: [
        ConfigService,
        LinkOnlyGitProvider,
        GitHubApiProvider
      ],
      useFactory: (
        config: ConfigService,
        linkOnly: LinkOnlyGitProvider,
        githubApi: GitHubApiProvider
      ) => {
        const mode = config.get<string>("GIT_MODE", "links");
        if (mode === "github_api") {
          return githubApi;
        }
        return linkOnly;
      }
    }
  ],
  exports: [
    IntegrationsService
  ]
})
export class IntegrationsModule {}
