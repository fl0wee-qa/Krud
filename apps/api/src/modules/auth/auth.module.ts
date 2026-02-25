import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [
        ConfigService
      ],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET", "change-me"),
        signOptions: {
          expiresIn: `${config.get<number>("JWT_ACCESS_TTL", 900)}s`
        }
      })
    })
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard
  ],
  controllers: [
    AuthController
  ],
  exports: [
    AuthService,
    JwtAuthGuard
  ]
})
export class AuthModule {}
