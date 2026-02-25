import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateSpecDto, UpdateSpecDto } from "./dto";

@Injectable()
export class SpecsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSpec(input: CreateSpecDto) {
    return this.prisma.specification.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        markdown: input.markdown,
        attachments: input.attachments as Prisma.InputJsonValue | undefined,
        versions: {
          create: {
            version: 1,
            markdown: input.markdown
          }
        }
      },
      include: {
        versions: true
      }
    });
  }

  async listSpecs(projectId: string) {
    return this.prisma.specification.findMany({
      where: {
        projectId
      },
      include: {
        versions: {
          orderBy: {
            version: "desc"
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  }

  async updateSpec(specId: string, input: UpdateSpecDto) {
    const current = await this.prisma.specification.findUnique({
      where: {
        id: specId
      },
      include: {
        versions: {
          orderBy: {
            version: "desc"
          },
          take: 1
        }
      }
    });
    if (!current) {
      throw new NotFoundException("Specification not found");
    }

    const nextVersion = (current.versions[0]?.version ?? 0) + 1;

    return this.prisma.specification.update({
      where: {
        id: specId
      },
      data: {
        title: input.title,
        markdown: input.markdown,
        attachments: input.attachments as Prisma.InputJsonValue | undefined,
        versions: input.markdown
          ? {
              create: {
                version: nextVersion,
                markdown: input.markdown
              }
            }
          : undefined
      },
      include: {
        versions: {
          orderBy: {
            version: "desc"
          }
        }
      }
    });
  }

  async getCoverage(projectId: string) {
    const [specs, covered] = await Promise.all([
      this.prisma.specification.count({
        where: {
          projectId
        }
      }),
      this.prisma.testCase.groupBy({
        by: [
          "linkedSpecId"
        ],
        where: {
          projectId,
          linkedSpecId: {
            not: null
          }
        },
        _count: {
          linkedSpecId: true
        }
      })
    ]);

    const coveredSpecs = covered.length;
    return {
      totalSpecs: specs,
      coveredSpecs,
      uncoveredSpecs: Math.max(0, specs - coveredSpecs)
    };
  }
}
