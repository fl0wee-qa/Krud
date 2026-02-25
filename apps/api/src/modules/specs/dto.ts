import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateSpecDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  markdown!: string;

  @IsObject()
  @IsOptional()
  attachments?: Record<string, unknown>;
}

export class UpdateSpecDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  markdown?: string;

  @IsObject()
  @IsOptional()
  attachments?: Record<string, unknown>;
}
