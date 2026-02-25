import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OutboundEventStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { SlackEvent, SlackNotifier } from "./slack-notifier";

@Injectable()
export class WebhookSlackNotifier implements SlackNotifier {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async notify(event: SlackEvent) {
    const webhookUrl = this.config.get<string>("SLACK_WEBHOOK_URL");
    if (!webhookUrl) {
      await this.prisma.outboundEvent.create({
        data: {
          projectId: event.projectId,
          type: `SLACK_${event.type}`,
          payload: event as unknown as Prisma.InputJsonValue,
          status: OutboundEventStatus.FAILED,
          error: "SLACK_WEBHOOK_URL is not configured"
        }
      });
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: event.message
        })
      });

      await this.prisma.outboundEvent.create({
        data: {
          projectId: event.projectId,
          type: `SLACK_${event.type}`,
          payload: event as unknown as Prisma.InputJsonValue,
          status: response.ok ? OutboundEventStatus.SENT : OutboundEventStatus.FAILED,
          error: response.ok ? null : `${response.status} ${response.statusText}`
        }
      });
    } catch (error) {
      await this.prisma.outboundEvent.create({
        data: {
          projectId: event.projectId,
          type: `SLACK_${event.type}`,
          payload: event as unknown as Prisma.InputJsonValue,
          status: OutboundEventStatus.FAILED,
          error: error instanceof Error ? error.message : "Unknown Slack webhook error"
        }
      });
    }
  }
}
