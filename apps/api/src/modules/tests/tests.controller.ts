import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateTestCaseDto, CreateTestRunDto, SaveTestResultDto, UpdateTestCaseDto } from "./dto";
import { TestsService } from "./tests.service";

@Controller("tests")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post("cases")
  @Roles("ADMIN", "QA")
  createTestCase(@CurrentUser() user: RequestUser, @Body() body: CreateTestCaseDto) {
    return this.testsService.createTestCase(user.id, body);
  }

  @Get("cases")
  listTestCases(@Query("projectId") projectId: string) {
    return this.testsService.listTestCases(projectId);
  }

  @Patch("cases/:id")
  @Roles("ADMIN", "QA")
  updateTestCase(@Param("id") id: string, @Body() body: UpdateTestCaseDto) {
    return this.testsService.updateTestCase(id, body);
  }

  @Post("runs")
  @Roles("ADMIN", "QA")
  createTestRun(@Body() body: CreateTestRunDto) {
    return this.testsService.createTestRun(body);
  }

  @Get("runs")
  listTestRuns(@Query("projectId") projectId: string) {
    return this.testsService.listTestRuns(projectId);
  }

  @Post("runs/:testRunId/results")
  @Roles("ADMIN", "QA")
  saveResult(
    @Param("testRunId") testRunId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: SaveTestResultDto
  ) {
    return this.testsService.saveResult(testRunId, user.id, body);
  }
}
