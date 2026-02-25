import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { Methodology } from "@prisma/client";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateProjectDto, UpdateProjectSettingsDto } from "./dto";
import { ProjectsService } from "./projects.service";

@Controller("projects")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles("ADMIN", "QA")
  createProject(@CurrentUser() user: RequestUser, @Body() body: CreateProjectDto) {
    return this.projectsService.createProject(user.id, body);
  }

  @Get()
  listMyProjects(@CurrentUser() user: RequestUser) {
    return this.projectsService.listProjectsForUser(user.id);
  }

  @Get(":projectId")
  getProject(@Param("projectId") projectId: string) {
    return this.projectsService.getProjectById(projectId);
  }

  @Patch(":projectId/settings")
  @Roles("ADMIN")
  updateSettings(
    @Param("projectId") projectId: string,
    @Body() body: UpdateProjectSettingsDto
  ) {
    return this.projectsService.updateSettings(projectId, body);
  }

  @Patch(":projectId/methodology/:methodology")
  @Roles("ADMIN")
  switchMethodology(
    @Param("projectId") projectId: string,
    @Param("methodology", new ParseEnumPipe(Methodology)) methodology: Methodology
  ) {
    return this.projectsService.switchMethodology(projectId, methodology);
  }
}
