import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateSpecDto, UpdateSpecDto } from "./dto";
import { SpecsService } from "./specs.service";

@Controller("specs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecsController {
  constructor(private readonly specsService: SpecsService) {}

  @Post()
  @Roles("ADMIN", "QA")
  createSpec(@Body() body: CreateSpecDto) {
    return this.specsService.createSpec(body);
  }

  @Get()
  listSpecs(@Query("projectId") projectId: string) {
    return this.specsService.listSpecs(projectId);
  }

  @Patch(":specId")
  @Roles("ADMIN", "QA")
  updateSpec(@Param("specId") specId: string, @Body() body: UpdateSpecDto) {
    return this.specsService.updateSpec(specId, body);
  }

  @Get("coverage/:projectId")
  getCoverage(@Param("projectId") projectId: string) {
    return this.specsService.getCoverage(projectId);
  }
}
