import { Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers(role?: UserRole) {
    return this.prisma.user.findMany({
      where: {
        role: role ?? undefined
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      orderBy: {
        email: "asc"
      }
    });
  }
}
