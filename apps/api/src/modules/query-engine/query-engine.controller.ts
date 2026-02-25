import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { QueryBugsDto, SaveFilterDto } from "./dto";
import { QueryEngineService } from "./query-engine.service";

@Controller("query")
@UseGuards(JwtAuthGuard, RolesGuard)
export class QueryEngineController {
  constructor(private readonly queryEngineService: QueryEngineService) {}

  @Post("bugs")
  queryBugs(@Body() body: QueryBugsDto) {
    return this.queryEngineService.queryBugs(body);
  }

  @Post("saved")
  saveFilter(@CurrentUser() user: RequestUser, @Body() body: SaveFilterDto) {
    return this.queryEngineService.saveFilter(user.id, body);
  }

  @Get("saved")
  listSavedFilters(@CurrentUser() user: RequestUser, @Query("projectId") projectId?: string) {
    return this.queryEngineService.listSavedFilters(user.id, projectId);
  }
}
