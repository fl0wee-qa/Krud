import { SprintStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class CreateSprintDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

export class UpdateSprintDto {
  @IsEnum(SprintStatus)
  @IsOptional()
  status?: SprintStatus;

  @IsString()
  @IsOptional()
  goal?: string;
}

export class CreateBoardColumnDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @MaxLength(40)
  name!: string;

  @IsInt()
  @Min(0)
  position!: number;

  @IsInt()
  @IsOptional()
  wipLimit?: number;
}

export class MoveBugDto {
  @IsUUID()
  bugId!: string;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsUUID()
  @IsOptional()
  columnId?: string;
}
