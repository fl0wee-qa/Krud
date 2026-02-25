import { Injectable, Logger } from "@nestjs/common";
import { OutboundEventStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { SlackEvent, SlackNotifier } from "./slack-notifier";

@Injectable()
export class MockSlackNotifier implements SlackNotifier {
  private readonly logger = new Logger(MockSlackNotifier.name);

  constructor(private readonly prisma: PrismaService) {}

  async notify(event: SlackEvent) {
    await this.prisma.outboundEvent.create({
      data: {
        projectId: event.projectId,
        type: `SLACK_${event.type}`,
        payload: event as unknown as Prisma.InputJsonValue,
        status: OutboundEventStatus.QUEUED
      }
    });

    this.logger.log(`[MOCK_SLACK] ${event.message}`);
  }
}
