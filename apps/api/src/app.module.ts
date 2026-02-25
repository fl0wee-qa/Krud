import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AgileModule } from "./modules/agile/agile.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BugsModule } from "./modules/bugs/bugs.module";
import { HealthModule } from "./modules/health/health.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { PrismaModule } from "./common/prisma/prisma.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { QueryEngineModule } from "./modules/query-engine/query-engine.module";
import { SpecsModule } from "./modules/specs/specs.module";
import { TestsModule } from "./modules/tests/tests.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        ".env",
        "../../.env"
      ]
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ProjectsModule,
    TestsModule,
    BugsModule,
    AgileModule,
    SpecsModule,
    IntegrationsModule,
    QueryEngineModule,
    UsersModule
  ]
})
export class AppModule {}
