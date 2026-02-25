import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Methodology, Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateProjectDto, UpdateProjectSettingsDto } from "./dto";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(userId: string, input: CreateProjectDto) {
    const key = input.key.toUpperCase();
    const existing = await this.prisma.project.findUnique({
      where: {
        key
      }
    });
    if (existing) {
      throw new BadRequestException("Project key already exists");
    }

    return this.prisma.project.create({
      data: {
        name: input.name,
        key,
        methodology: input.methodology ?? Methodology.SCRUM,
        modules: {
          tests: true,
          bugs: true,
          specs: true,
          agile: true
        },
        workflowConfig: {
          bugStatuses: [
            "OPEN",
            "IN_PROGRESS",
            "READY_FOR_QA",
            "CLOSED"
          ]
        },
        members: {
          create: {
            userId,
            role: UserRole.ADMIN
          }
        }
      },
      include: {
        members: true
      }
    });
  }

  async listProjectsForUser(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: {
        userId
      },
      include: {
        project: true
      }
    });

    return memberships.map((item) => ({
      membershipRole: item.role,
      ...item.project
    }));
  }

  async getProjectById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId
      }
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    return project;
  }

  async updateSettings(projectId: string, input: UpdateProjectSettingsDto) {
    await this.getProjectById(projectId);
    return this.prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        workflowConfig: input.workflowConfig as Prisma.InputJsonValue | undefined,
        customFields: input.customFields as Prisma.InputJsonValue | undefined,
        tags: input.tags,
        sprintDurationDays: input.sprintDurationDays,
        modules: input.modules as Prisma.InputJsonValue | undefined
      }
    });
  }

  async switchMethodology(projectId: string, methodology: Methodology) {
    await this.getProjectById(projectId);
    return this.prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        methodology
      }
    });
  }
}
