import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { QueryBugsDto, SaveFilterDto } from "./dto";

type Logical = "AND" | "OR";

@Injectable()
export class QueryEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async queryBugs(input: QueryBugsDto) {
    const dynamicWhere = input.query ? this.parseBugQuery(input.query) : {};

    return this.prisma.bug.findMany({
      where: {
        projectId: input.projectId,
        ...(dynamicWhere as Prisma.BugWhereInput)
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  }

  saveFilter(userId: string, input: SaveFilterDto) {
    return this.prisma.savedFilter.create({
      data: {
        projectId: input.projectId,
        userId,
        name: input.name,
        query: input.query,
        preset: input.preset
      }
    });
  }

  listSavedFilters(userId: string, projectId?: string) {
    return this.prisma.savedFilter.findMany({
      where: {
        userId,
        projectId: projectId ?? undefined
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  parseBugQuery(rawQuery: string): Prisma.BugWhereInput {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      return {};
    }

    const chunks = trimmed.split(/\s+(AND|OR)\s+/i);
    const conditions: Prisma.BugWhereInput[] = [];
    const operators: Logical[] = [];

    for (let index = 0; index < chunks.length; index += 1) {
      if (index % 2 === 0) {
        conditions.push(this.parseCondition(chunks[index]));
      } else {
        const op = chunks[index].toUpperCase();
        if (op !== "AND" && op !== "OR") {
          throw new BadRequestException(`Unsupported logical operator: ${chunks[index]}`);
        }
        operators.push(op);
      }
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    let acc = conditions[0];
    for (let i = 0; i < operators.length; i += 1) {
      const next = conditions[i + 1];
      acc = {
        [operators[i]]: [
          acc,
          next
        ]
      };
    }

    return acc;
  }

  private parseCondition(rawCondition: string): Prisma.BugWhereInput {
    const condition = rawCondition.trim();
    const textMatch = condition.match(/^text\s*~\s*"(.+)"$/i);
    if (textMatch) {
      const value = textMatch[1];
      return {
        OR: [
          {
            title: {
              contains: value,
              mode: "insensitive"
            }
          },
          {
            description: {
              contains: value,
              mode: "insensitive"
            }
          }
        ]
      };
    }

    const inMatch = condition.match(/^([a-zA-Z_][\w]*)\s+IN\s+\((.+)\)$/i);
    if (inMatch) {
      const field = inMatch[1];
      const values = inMatch[2]
        .split(",")
        .map((part) => this.cleanValue(part))
        .filter(Boolean);

      return this.mapInCondition(field, values);
    }

    const compareMatch = condition.match(/^([a-zA-Z_][\w]*)\s*(=|!=|>=|<=|>|<)\s*(.+)$/);
    if (!compareMatch) {
      throw new BadRequestException(`Invalid condition syntax: ${condition}`);
    }

    const [, field, operator, rawValue] = compareMatch;
    const value = this.cleanValue(rawValue);
    return this.mapComparisonCondition(field, operator, value);
  }

  private mapInCondition(field: string, values: string[]): Prisma.BugWhereInput {
    switch (field) {
      case "status":
        return { status: { in: values as any[] } };
      case "severity":
        return { severity: { in: values as any[] } };
      case "priority":
        return { priority: { in: values as any[] } };
      case "assignee":
      case "assigneeId":
        return { assigneeId: { in: values } };
      default:
        throw new BadRequestException(`Unsupported IN field: ${field}`);
    }
  }

  private mapComparisonCondition(field: string, operator: string, value: string): Prisma.BugWhereInput {
    if (field === "created" || field === "createdAt") {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(`Invalid date value: ${value}`);
      }
      return this.dateOperator("createdAt", operator, date);
    }

    if (field === "updatedAt") {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(`Invalid date value: ${value}`);
      }
      return this.dateOperator("updatedAt", operator, date);
    }

    switch (field) {
      case "status":
      case "severity":
      case "priority":
      case "assignee":
      case "assigneeId":
      case "title":
        return this.stringOperator(field === "assignee" ? "assigneeId" : field, operator, value);
      default:
        throw new BadRequestException(`Unsupported field: ${field}`);
    }
  }

  private stringOperator(
    field: "status" | "severity" | "priority" | "assigneeId" | "title",
    operator: string,
    value: string
  ): Prisma.BugWhereInput {
    if (operator === "=") {
      return {
        [field]: value
      };
    }
    if (operator === "!=") {
      return {
        [field]: {
          not: value
        }
      };
    }
    throw new BadRequestException(`Operator ${operator} is not valid for ${field}`);
  }

  private dateOperator(
    field: "createdAt" | "updatedAt",
    operator: string,
    value: Date
  ): Prisma.BugWhereInput {
    switch (operator) {
      case "=":
        return {
          [field]: value
        };
      case "!=":
        return {
          [field]: {
            not: value
          }
        };
      case ">":
        return {
          [field]: {
            gt: value
          }
        };
      case "<":
        return {
          [field]: {
            lt: value
          }
        };
      case ">=":
        return {
          [field]: {
            gte: value
          }
        };
      case "<=":
        return {
          [field]: {
            lte: value
          }
        };
      default:
        throw new BadRequestException(`Unsupported date operator: ${operator}`);
    }
  }

  private cleanValue(rawValue: string) {
    return rawValue.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
}
