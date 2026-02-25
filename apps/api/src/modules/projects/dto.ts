import { Methodology } from "@prisma/client";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min
} from "class-validator";

export class CreateProjectDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @Length(2, 8)
  key!: string;

  @IsEnum(Methodology)
  @IsOptional()
  methodology?: Methodology;
}

export class UpdateProjectSettingsDto {
  @IsObject()
  @IsOptional()
  workflowConfig?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  customFields?: Record<string, unknown>;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsInt()
  @Min(1)
  @IsOptional()
  sprintDurationDays?: number;

  @IsObject()
  @IsOptional()
  modules?: {
    tests?: boolean;
    bugs?: boolean;
    specs?: boolean;
    agile?: boolean;
  };

  @IsBoolean()
  @IsOptional()
  enableSlack?: boolean;
}
