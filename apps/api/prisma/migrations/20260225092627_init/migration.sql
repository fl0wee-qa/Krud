-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'QA', 'DEVELOPER', 'VIEWER');

-- CreateEnum
CREATE TYPE "Methodology" AS ENUM ('SCRUM', 'KANBAN');

-- CreateEnum
CREATE TYPE "TestCaseStatus" AS ENUM ('DRAFT', 'READY', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "TestCaseType" AS ENUM ('FUNCTIONAL', 'REGRESSION', 'SMOKE');

-- CreateEnum
CREATE TYPE "TestRunResultStatus" AS ENUM ('PASS', 'FAIL', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BugSeverity" AS ENUM ('S1', 'S2', 'S3', 'S4');

-- CreateEnum
CREATE TYPE "BugPriority" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'READY_FOR_QA', 'CLOSED');

-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('SLACK', 'GITHUB', 'GITLAB');

-- CreateEnum
CREATE TYPE "IntegrationMode" AS ENUM ('MOCK', 'WEBHOOK', 'LINKS', 'GITHUB_API');

-- CreateEnum
CREATE TYPE "OutboundEventStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'QA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "methodology" "Methodology" NOT NULL DEFAULT 'SCRUM',
    "modules" JSONB,
    "workflowConfig" JSONB,
    "customFields" JSONB,
    "tags" TEXT[],
    "sprintDurationDays" INTEGER NOT NULL DEFAULT 14,
    "gitIntegrationSettings" JSONB,
    "slackIntegrationSetting" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSuite" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestSuite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "suiteId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "preconditions" TEXT,
    "steps" JSONB NOT NULL,
    "expected" TEXT,
    "priority" "BugPriority" NOT NULL,
    "status" "TestCaseStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "TestCaseType" NOT NULL,
    "tags" TEXT[],
    "linkedSpecId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assignedQaId" TEXT,
    "executionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRunResult" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "result" "TestRunResultStatus" NOT NULL,
    "comment" TEXT,
    "linkedBugId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestRunResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bug" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stepsToReproduce" TEXT,
    "expected" TEXT,
    "actual" TEXT,
    "severity" "BugSeverity" NOT NULL,
    "priority" "BugPriority" NOT NULL,
    "status" "BugStatus" NOT NULL DEFAULT 'OPEN',
    "linkedTestCaseId" TEXT,
    "linkedGitCommit" TEXT,
    "sprintId" TEXT,
    "columnId" TEXT,
    "assigneeId" TEXT,
    "reporterId" TEXT NOT NULL,
    "tags" TEXT[],
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sprint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardColumn" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "wipLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specification" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecVersion" (
    "id" TEXT NOT NULL,
    "specificationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "markdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFilter" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "preset" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "mode" "IntegrationMode" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboundEventStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Project_key_key" ON "Project"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TestRunResult_testRunId_testCaseId_key" ON "TestRunResult"("testRunId", "testCaseId");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSuite" ADD CONSTRAINT "TestSuite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSuite" ADD CONSTRAINT "TestSuite_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TestSuite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "TestSuite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_linkedSpecId_fkey" FOREIGN KEY ("linkedSpecId") REFERENCES "Specification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_assignedQaId_fkey" FOREIGN KEY ("assignedQaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRunResult" ADD CONSTRAINT "TestRunResult_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRunResult" ADD CONSTRAINT "TestRunResult_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRunResult" ADD CONSTRAINT "TestRunResult_linkedBugId_fkey" FOREIGN KEY ("linkedBugId") REFERENCES "Bug"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bug" ADD CONSTRAINT "Bug_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bug" ADD CONSTRAINT "Bug_linkedTestCaseId_fkey" FOREIGN KEY ("linkedTestCaseId") REFERENCES "TestCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bug" ADD CONSTRAINT "Bug_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bug" ADD CONSTRAINT "Bug_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "BoardColumn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bug" ADD CONSTRAINT "Bug_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bug" ADD CONSTRAINT "Bug_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardColumn" ADD CONSTRAINT "BoardColumn_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specification" ADD CONSTRAINT "Specification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecVersion" ADD CONSTRAINT "SpecVersion_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "Specification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedFilter" ADD CONSTRAINT "SavedFilter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedFilter" ADD CONSTRAINT "SavedFilter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundEvent" ADD CONSTRAINT "OutboundEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
