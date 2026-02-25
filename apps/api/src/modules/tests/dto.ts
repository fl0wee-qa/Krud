import { BugPriority, BugSeverity, TestCaseStatus, TestCaseType, TestRunResultStatus } from "@prisma/client";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from "class-validator";

export class CreateTestCaseDto {
  @IsUUID()
  projectId!: string;

  @IsUUID()
  @IsOptional()
  suiteId?: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  preconditions?: string;

  @IsArray()
  steps!: string[];

  @IsString()
  @IsOptional()
  expected?: string;

  @IsEnum(BugPriority)
  priority!: BugPriority;

  @IsEnum(TestCaseStatus)
  @IsOptional()
  status?: TestCaseStatus;

  @IsEnum(TestCaseType)
  type!: TestCaseType;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsUUID()
  @IsOptional()
  linkedSpecId?: string;
}

export class UpdateTestCaseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  steps?: string[];

  @IsEnum(TestCaseStatus)
  @IsOptional()
  status?: TestCaseStatus;

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class CreateTestRunDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsUUID()
  @IsOptional()
  assignedQaId?: string;

  @IsDateString()
  executionDate!: string;

  @IsArray()
  testCaseIds!: string[];
}

export class SaveTestResultDto {
  @IsUUID()
  testCaseId!: string;

  @IsEnum(TestRunResultStatus)
  result!: TestRunResultStatus;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsObject()
  @IsOptional()
  autoCreateBug?: {
    enabled: boolean;
    title?: string;
    severity?: BugSeverity;
    priority?: BugPriority;
  };
}
