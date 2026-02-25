import { IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export class SlackTestNotificationDto {
  @IsString()
  message!: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;
}

export class ResolveGitResourceDto {
  @IsString()
  url!: string;
}

export class GitWebhookDto {
  @IsObject()
  payload!: Record<string, unknown>;
}
