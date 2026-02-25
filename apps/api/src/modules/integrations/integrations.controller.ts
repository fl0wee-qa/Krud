import { Body, Controller, Get, Headers, Post, Query, UseGuards } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GitWebhookDto, ResolveGitResourceDto, SlackTestNotificationDto } from "./dto";
import { IntegrationsService } from "./integrations.service";

@Controller("integrations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post("slack/test")
  @Roles("ADMIN", "QA")
  async sendSlackTestNotification(@Body() body: SlackTestNotificationDto) {
    await this.integrationsService.notifySlack({
      type: "BUG_CREATED",
      projectId: body.projectId,
      message: body.message
    });

    return {
      queued: true
    };
  }

  @Post("git/resolve")
  resolveGitResource(@Body() body: ResolveGitResourceDto) {
    return this.integrationsService.resolveGitResource(body.url);
  }

  @Post("git/webhook")
  receiveGitWebhook(
    @Headers("x-hub-signature-256") signature: string | undefined,
    @Body() body: GitWebhookDto
  ) {
    return this.integrationsService.receiveGitWebhook(signature, body.payload);
  }

  @Get("events")
  @Roles("ADMIN", "QA")
  listEvents(@Query("projectId") projectId?: string) {
    return this.integrationsService.listOutboundEvents(projectId);
  }
}
