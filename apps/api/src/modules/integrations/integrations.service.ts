import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OutboundEventStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GitProvider, GIT_PROVIDER } from "./adapters/git-provider";
import { SlackEvent, SLACK_NOTIFIER, SlackNotifier } from "./adapters/slack-notifier";

@Injectable()
export class IntegrationsService {
  constructor(
    @Inject(SLACK_NOTIFIER) private readonly slackNotifier: SlackNotifier,
    @Inject(GIT_PROVIDER) private readonly gitProvider: GitProvider,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  notifySlack(event: SlackEvent) {
    return this.slackNotifier.notify(event);
  }

  resolveGitResource(url: string) {
    return this.gitProvider.resolveResource({
      url
    });
  }

  async receiveGitWebhook(secret: string | undefined, payload: Record<string, unknown>) {
    const expectedSecret = this.config.get<string>("GITHUB_WEBHOOK_SECRET");
    if (expectedSecret && secret !== expectedSecret) {
      throw new UnauthorizedException("Invalid webhook secret");
    }

    await this.prisma.outboundEvent.create({
      data: {
        type: "GIT_WEBHOOK_RECEIVED",
        payload: payload as unknown as Prisma.InputJsonValue,
        status: OutboundEventStatus.QUEUED
      }
    });

    return {
      ok: true
    };
  }

  listOutboundEvents(projectId?: string) {
    return this.prisma.outboundEvent.findMany({
      where: projectId
        ? {
            projectId
          }
        : undefined,
      orderBy: {
        createdAt: "desc"
      }
    });
  }
}
