import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AgileService } from "./agile.service";
import { CreateBoardColumnDto, CreateSprintDto, MoveBugDto, UpdateSprintDto } from "./dto";

@Controller("agile")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgileController {
  constructor(private readonly agileService: AgileService) {}

  @Post("sprints")
  @Roles("ADMIN", "QA")
  createSprint(@Body() body: CreateSprintDto) {
    return this.agileService.createSprint(body);
  }

  @Get("sprints")
  listSprints(@Query("projectId") projectId: string) {
    return this.agileService.listSprints(projectId);
  }

  @Patch("sprints/:sprintId")
  @Roles("ADMIN", "QA")
  updateSprint(@Param("sprintId") sprintId: string, @Body() body: UpdateSprintDto) {
    return this.agileService.updateSprint(sprintId, body);
  }

  @Post("columns")
  @Roles("ADMIN")
  createBoardColumn(@Body() body: CreateBoardColumnDto) {
    return this.agileService.createBoardColumn(body);
  }

  @Get("columns")
  listBoardColumns(@Query("projectId") projectId: string) {
    return this.agileService.listBoardColumns(projectId);
  }

  @Patch("move-bug")
  @Roles("ADMIN", "QA", "DEVELOPER")
  moveBug(@Body() body: MoveBugDto) {
    return this.agileService.moveBug(body);
  }
}
