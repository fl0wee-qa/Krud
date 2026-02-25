import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export enum UserRoleDto {
  ADMIN = "ADMIN",
  QA = "QA",
  DEVELOPER = "DEVELOPER",
  VIEWER = "VIEWER"
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(UserRoleDto)
  @IsOptional()
  role?: UserRoleDto;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
