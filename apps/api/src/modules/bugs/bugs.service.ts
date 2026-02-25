import { Injectable, NotFoundException } from "@nestjs/common";
import { BugStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateBugDto, UpdateBugDto } from "./dto";

@Injectable()
export class BugsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBug(reporterId: string, input: CreateBugDto) {
    return this.prisma.bug.create({
      data: {
        ...input,
        status: BugStatus.OPEN,
        reporterId,
        tags: input.tags ?? []
      }
    });
  }

  async listBugs(projectId: string) {
    return this.prisma.bug.findMany({
      where: {
        projectId
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  }

  async getBugById(id: string) {
    const bug = await this.prisma.bug.findUnique({
      where: {
        id
      }
    });
    if (!bug) {
      throw new NotFoundException("Bug not found");
    }
    return bug;
  }

  async updateBug(id: string, input: UpdateBugDto) {
    await this.getBugById(id);
    return this.prisma.bug.update({
      where: {
        id
      },
      data: input
    });
  }
}
