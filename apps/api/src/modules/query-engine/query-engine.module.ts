import { Module } from "@nestjs/common";
import { QueryEngineController } from "./query-engine.controller";
import { QueryEngineService } from "./query-engine.service";

@Module({
  controllers: [
    QueryEngineController
  ],
  providers: [
    QueryEngineService
  ],
  exports: [
    QueryEngineService
  ]
})
export class QueryEngineModule {}
