import { UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@krud.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Admin12345!";
  const name = process.env.ADMIN_NAME ?? "Krud Admin";
  const passwordHash = await bcrypt.hash(password, 10);
  const viewerEmail = (process.env.VIEWER_EMAIL ?? "viewer@krud.local").toLowerCase();
  const viewerPassword = process.env.VIEWER_PASSWORD ?? "Viewer12345!";
  const viewerHash = await bcrypt.hash(viewerPassword, 10);
  const developerEmail = (process.env.DEVELOPER_EMAIL ?? "developer@krud.local").toLowerCase();
  const developerPassword = process.env.DEVELOPER_PASSWORD ?? "Developer12345!";
  const developerHash = await bcrypt.hash(developerPassword, 10);

  const admin = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      name,
      role: UserRole.ADMIN,
      passwordHash
    },
    create: {
      email,
      name,
      role: UserRole.ADMIN,
      passwordHash
    }
  });

  const viewer = await prisma.user.upsert({
    where: {
      email: viewerEmail
    },
    update: {
      name: "Krud Viewer",
      role: UserRole.VIEWER,
      passwordHash: viewerHash
    },
    create: {
      email: viewerEmail,
      name: "Krud Viewer",
      role: UserRole.VIEWER,
      passwordHash: viewerHash
    }
  });

  const developer = await prisma.user.upsert({
    where: {
      email: developerEmail
    },
    update: {
      name: "Krud Developer",
      role: UserRole.DEVELOPER,
      passwordHash: developerHash
    },
    create: {
      email: developerEmail,
      name: "Krud Developer",
      role: UserRole.DEVELOPER,
      passwordHash: developerHash
    }
  });

  console.log(`Seeded admin user: ${admin.email}`);
  console.log(`Seeded viewer user: ${viewer.email}`);
  console.log(`Seeded developer user: ${developer.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
