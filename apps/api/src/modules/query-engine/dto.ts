import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class QueryBugsDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @IsOptional()
  query?: string;
}

export class SaveFilterDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  query!: string;

  @IsString()
  @IsOptional()
  preset?: string;
}
