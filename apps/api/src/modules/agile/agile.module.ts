import { Module } from "@nestjs/common";
import { AgileController } from "./agile.controller";
import { AgileService } from "./agile.service";

@Module({
  controllers: [
    AgileController
  ],
  providers: [
    AgileService
  ],
  exports: [
    AgileService
  ]
})
export class AgileModule {}
