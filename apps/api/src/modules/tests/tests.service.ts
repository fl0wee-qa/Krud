import { Injectable, NotFoundException } from "@nestjs/common";
import { BugPriority, BugSeverity, BugStatus, TestCaseStatus, TestRunResultStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateTestCaseDto, CreateTestRunDto, SaveTestResultDto, UpdateTestCaseDto } from "./dto";

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTestCase(userId: string, input: CreateTestCaseDto) {
    return this.prisma.testCase.create({
      data: {
        ...input,
        status: input.status ?? TestCaseStatus.DRAFT,
        steps: input.steps,
        tags: input.tags ?? [],
        createdById: userId
      }
    });
  }

  async listTestCases(projectId: string) {
    return this.prisma.testCase.findMany({
      where: {
        projectId
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  }

  async updateTestCase(id: string, input: UpdateTestCaseDto) {
    const existing = await this.prisma.testCase.findUnique({
      where: {
        id
      }
    });
    if (!existing) {
      throw new NotFoundException("Test case not found");
    }

    return this.prisma.testCase.update({
      where: {
        id
      },
      data: {
        ...input,
        steps: input.steps ?? undefined
      }
    });
  }

  async createTestRun(input: CreateTestRunDto) {
    const run = await this.prisma.testRun.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        assignedQaId: input.assignedQaId,
        executionDate: new Date(input.executionDate)
      }
    });

    await this.prisma.testRunResult.createMany({
      data: input.testCaseIds.map((testCaseId) => ({
        testRunId: run.id,
        testCaseId,
        result: TestRunResultStatus.BLOCKED
      }))
    });

    return this.prisma.testRun.findUnique({
      where: {
        id: run.id
      },
      include: {
        results: true
      }
    });
  }

  async listTestRuns(projectId: string) {
    return this.prisma.testRun.findMany({
      where: {
        projectId
      },
      include: {
        results: true
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  }

  async saveResult(testRunId: string, reporterId: string, input: SaveTestResultDto) {
    const run = await this.prisma.testRun.findUnique({
      where: {
        id: testRunId
      }
    });
    if (!run) {
      throw new NotFoundException("Test run not found");
    }

    const result = await this.prisma.testRunResult.update({
      where: {
        testRunId_testCaseId: {
          testRunId,
          testCaseId: input.testCaseId
        }
      },
      data: {
        result: input.result,
        comment: input.comment
      }
    });

    if (input.result === TestRunResultStatus.FAIL && input.autoCreateBug?.enabled) {
      const bug = await this.prisma.bug.create({
        data: {
          projectId: run.projectId,
          title: input.autoCreateBug.title ?? `Failed test ${input.testCaseId}`,
          severity: input.autoCreateBug.severity ?? BugSeverity.S2,
          priority: input.autoCreateBug.priority ?? BugPriority.P2,
          status: BugStatus.OPEN,
          linkedTestCaseId: input.testCaseId,
          reporterId,
          tags: [
            "auto-generated"
          ]
        }
      });

      return this.prisma.testRunResult.update({
        where: {
          id: result.id
        },
        data: {
          linkedBugId: bug.id
        }
      });
    }

    return result;
  }
}
