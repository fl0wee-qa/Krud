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
import { BugsService } from "./bugs.service";
import { CreateBugDto, UpdateBugDto } from "./dto";

@Controller("bugs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BugsController {
  constructor(private readonly bugsService: BugsService) {}

  @Post()
  @Roles("ADMIN", "QA", "DEVELOPER")
  createBug(@CurrentUser() user: RequestUser, @Body() body: CreateBugDto) {
    return this.bugsService.createBug(user.id, body);
  }

  @Get()
  listBugs(@Query("projectId") projectId: string) {
    return this.bugsService.listBugs(projectId);
  }

  @Get(":id")
  getBugById(@Param("id") id: string) {
    return this.bugsService.getBugById(id);
  }

  @Patch(":id")
  @Roles("ADMIN", "QA", "DEVELOPER")
  updateBug(@Param("id") id: string, @Body() body: UpdateBugDto) {
    return this.bugsService.updateBug(id, body);
  }
}
