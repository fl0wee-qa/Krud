import { BugPriority, BugSeverity, BugStatus } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from "class-validator";

export class CreateBugDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  stepsToReproduce?: string;

  @IsString()
  @IsOptional()
  expected?: string;

  @IsString()
  @IsOptional()
  actual?: string;

  @IsEnum(BugSeverity)
  severity!: BugSeverity;

  @IsEnum(BugPriority)
  priority!: BugPriority;

  @IsUUID()
  @IsOptional()
  linkedTestCaseId?: string;

  @IsString()
  @IsOptional()
  linkedGitCommit?: string;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateBugDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BugSeverity)
  @IsOptional()
  severity?: BugSeverity;

  @IsEnum(BugPriority)
  @IsOptional()
  priority?: BugPriority;

  @IsEnum(BugStatus)
  @IsOptional()
  status?: BugStatus;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
