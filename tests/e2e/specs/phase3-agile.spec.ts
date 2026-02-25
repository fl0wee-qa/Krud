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
    name: `Agile-${suffix}`,
    key: `A${suffix}`
  };
}

async function createProject(page: Page) {
  const project = randomProject();
  await page.getByTestId("project-name").fill(project.name);
  await page.getByTestId("project-key").fill(project.key);
  await page.getByTestId("project-methodology").selectOption("KANBAN");
  await page.getByTestId("project-submit").click();
  await expect(page.getByTestId("project-created-key")).toContainText(project.key);
  return project;
}

async function selectProject(page: Page, project: { key: string; name: string }) {
  await page.getByTestId("bug-project").selectOption({
    label: `${project.key} - ${project.name}`
  });
}

async function createColumn(
  page: Page,
  input: {
    name: string;
    position: number;
    wip: number;
  }
) {
  await page.getByTestId("agile-column-name").fill(input.name);
  await page.getByTestId("agile-column-position").fill(String(input.position));
  await page.getByTestId("agile-column-wip").fill(String(input.wip));
  await page.getByTestId("agile-column-submit").click();
  await expect(page.getByTestId("agile-column-created-id")).toContainText("Created column id:");
}

async function createBug(page: Page, title: string) {
  await page.getByTestId("bug-title").fill(title);
  await page.getByTestId("bug-description").fill(`Created for ${title}`);
  await page.getByTestId("bug-severity").selectOption("S2");
  await page.getByTestId("bug-priority").selectOption("P2");
  await page.getByTestId("bug-submit").click();
  await expect(page.getByTestId("bug-created-id")).toContainText("Created bug id:");
}

test.beforeEach(async ({ request, page }) => {
  await assertAdminLogin(request);
  await loginViaUi(page);
});

test("phase3 agile: create sprint via UI", async ({ page }) => {
  const project = await createProject(page);
  await selectProject(page, project);

  await page.getByTestId("agile-sprint-name").fill(`Sprint ${Date.now()}`);
  await page.getByTestId("agile-sprint-goal").fill("Finish board setup");
  await page.getByTestId("agile-sprint-submit").click();

  await expect(page.getByTestId("agile-sprint-created-id")).toContainText("Created sprint id:");
});

test("phase3 agile: move card in kanban via UI", async ({ page }) => {
  const project = await createProject(page);
  await selectProject(page, project);

  await createColumn(page, {
    name: "To Do",
    position: 0,
    wip: 4
  });
  await createColumn(page, {
    name: "In Progress",
    position: 1,
    wip: 3
  });

  const bugTitle = `Kanban card ${Date.now()}`;
  await createBug(page, bugTitle);

  await page.getByTestId("agile-move-bug").selectOption({
    label: bugTitle
  });
  await page.getByTestId("agile-move-column").selectOption({
    label: "In Progress"
  });
  await page.getByTestId("agile-move-submit").click();

  await expect(page.getByTestId("agile-move-success")).toContainText("Moved bug:");
  await expect(page.getByTestId("agile-board")).toContainText(bugTitle);
});

test("phase3 agile: wip limit warning via UI", async ({ page }) => {
  const project = await createProject(page);
  await selectProject(page, project);

  await createColumn(page, {
    name: "Review",
    position: 0,
    wip: 1
  });

  const firstBug = `WIP first ${Date.now()}`;
  const secondBug = `WIP second ${Date.now()}`;
  await createBug(page, firstBug);
  await createBug(page, secondBug);

  await page.getByTestId("agile-move-bug").selectOption({
    label: firstBug
  });
  await page.getByTestId("agile-move-column").selectOption({
    label: "Review"
  });
  await page.getByTestId("agile-move-submit").click();
  await expect(page.getByTestId("agile-move-success")).toContainText("Moved bug:");

  await page.getByTestId("agile-move-bug").selectOption({
    label: secondBug
  });
  await page.getByTestId("agile-move-column").selectOption({
    label: "Review"
  });
  await page.getByTestId("agile-move-submit").click();
  await expect(page.getByTestId("agile-move-success")).toContainText("Moved bug:");

  await expect(page.getByTestId("agile-wip-warning")).toContainText("Review exceeds limit");
});
