import { APIRequestContext, expect, Page, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@krud.local").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin12345!";

async function assertAdminLogin(request: APIRequestContext) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });
  expect(response.ok(), "Admin user is missing. Run `npm run db:seed`.").toBeTruthy();
}

async function loginViaUi(page: Page) {
  await page.goto("/");
  await page.getByTestId("login-email").fill(ADMIN_EMAIL);
  await page.getByTestId("login-password").fill(ADMIN_PASSWORD);
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("auth-email-badge")).toContainText(ADMIN_EMAIL);
}

function randomProject() {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return {
    name: `Query-${suffix}`,
    key: `J${suffix}`
  };
}

async function createProject(page: Page) {
  const project = randomProject();
  await page.getByTestId("project-name").fill(project.name);
  await page.getByTestId("project-key").fill(project.key);
  await page.getByTestId("project-methodology").selectOption("SCRUM");
  await page.getByTestId("project-submit").click();
  await expect(page.getByTestId("project-created-key")).toContainText(project.key);
  return project;
}

async function selectProject(page: Page, project: { key: string; name: string }) {
  await page.getByTestId("bug-project").selectOption({
    label: `${project.key} - ${project.name}`
  });
}

async function createBug(
  page: Page,
  input: {
    title: string;
    severity: "S1" | "S2" | "S3" | "S4";
    priority: "P1" | "P2" | "P3" | "P4";
  }
) {
  await page.getByTestId("bug-title").fill(input.title);
  await page.getByTestId("bug-description").fill(`Query seed for ${input.title}`);
  await page.getByTestId("bug-severity").selectOption(input.severity);
  await page.getByTestId("bug-priority").selectOption(input.priority);
  await page.getByTestId("bug-submit").click();
  await expect(page.getByTestId("bug-created-id")).toContainText("Created bug id:");
}

async function runBugQuery(page: Page, query: string) {
  await page.getByTestId("bug-query-input").fill(query);
  await page.getByTestId("bug-query-submit").click();
}

test.beforeEach(async ({ request, page }) => {
  await assertAdminLogin(request);
  await loginViaUi(page);
});

test("phase4 query: equality and logical operators", async ({ page }) => {
  const project = await createProject(page);
  await selectProject(page, project);

  const matching = `Eq-S1-${Date.now()}`;
  const nonMatching = `Eq-S3-${Date.now()}`;
  await createBug(page, {
    title: matching,
    severity: "S1",
    priority: "P2"
  });
  await createBug(page, {
    title: nonMatching,
    severity: "S3",
    priority: "P2"
  });

  await runBugQuery(page, "status = \"OPEN\" AND severity = \"S1\"");

  await expect(page.getByTestId("bug-query-results")).toContainText(matching);
  await expect(page.getByTestId("bug-query-results")).not.toContainText(nonMatching);
});

test("phase4 query: IN operator", async ({ page }) => {
  const project = await createProject(page);
  await selectProject(page, project);

  const p1Bug = `In-P1-${Date.now()}`;
  const p4Bug = `In-P4-${Date.now()}`;
  await createBug(page, {
    title: p1Bug,
    severity: "S2",
    priority: "P1"
  });
  await createBug(page, {
    title: p4Bug,
    severity: "S2",
    priority: "P4"
  });

  await runBugQuery(page, "priority IN (\"P1\",\"P2\")");

  await expect(page.getByTestId("bug-query-results")).toContainText(p1Bug);
  await expect(page.getByTestId("bug-query-results")).not.toContainText(p4Bug);
});

test("phase4 query: date comparisons", async ({ page }) => {
  const project = await createProject(page);
  await selectProject(page, project);

  const dateBug = `Date-${Date.now()}`;
  await createBug(page, {
    title: dateBug,
    severity: "S2",
    priority: "P2"
  });

  await runBugQuery(page, "created < \"2100-01-01\"");
  await expect(page.getByTestId("bug-query-results")).toContainText(dateBug);

  await runBugQuery(page, "created > \"2100-01-01\"");
  await expect(page.getByTestId("bug-query-results")).not.toContainText(dateBug);
});

test("phase4 query: invalid syntax", async ({ page }) => {
  const project = await createProject(page);
  await selectProject(page, project);

  await runBugQuery(page, "status =");
  await expect(page.getByTestId("form-error")).toContainText("Invalid condition syntax");
});
