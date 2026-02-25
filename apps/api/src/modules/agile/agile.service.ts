import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateBoardColumnDto, CreateSprintDto, MoveBugDto, UpdateSprintDto } from "./dto";

@Injectable()
export class AgileService {
  constructor(private readonly prisma: PrismaService) {}

  createSprint(input: CreateSprintDto) {
    return this.prisma.sprint.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        goal: input.goal,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate)
      }
    });
  }

  listSprints(projectId: string) {
    return this.prisma.sprint.findMany({
      where: {
        projectId
      },
      orderBy: {
        startDate: "desc"
      }
    });
  }

  updateSprint(sprintId: string, input: UpdateSprintDto) {
    return this.prisma.sprint.update({
      where: {
        id: sprintId
      },
      data: input
    });
  }

  createBoardColumn(input: CreateBoardColumnDto) {
    return this.prisma.boardColumn.create({
      data: input
    });
  }

  listBoardColumns(projectId: string) {
    return this.prisma.boardColumn.findMany({
      where: {
        projectId
      },
      orderBy: {
        position: "asc"
      }
    });
  }

  moveBug(input: MoveBugDto) {
    return this.prisma.bug.update({
      where: {
        id: input.bugId
      },
      data: {
        sprintId: input.sprintId,
        columnId: input.columnId
      }
    });
  }
}
