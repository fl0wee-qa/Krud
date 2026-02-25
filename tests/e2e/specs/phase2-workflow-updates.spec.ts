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
    name: `Flow-${suffix}`,
    key: `F${suffix}`
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

test.beforeEach(async ({ request, page }) => {
  await assertAdminLogin(request);
  await loginViaUi(page);
});

test("phase2 test-cases: edit test case via UI", async ({ page }) => {
  const project = await createProject(page);
  const createdTitle = "Editable test case";
  const updatedTitle = "Editable test case updated";

  await page.getByTestId("test-case-project").selectOption({
    label: `${project.key} - ${project.name}`
  });
  await page.getByTestId("test-case-title").fill(createdTitle);
  await page.getByTestId("test-case-steps").fill("Step one\nStep two");
  await page.getByTestId("test-case-submit").click();
  await expect(page.getByTestId("test-case-created-id")).toContainText("Created test case id:");

  await page.getByTestId("test-case-edit-title").fill(updatedTitle);
  await page.getByTestId("test-case-edit-status").selectOption("DEPRECATED");
  await page.getByTestId("test-case-edit-submit").click();

  await expect(page.getByTestId("test-case-updated-id")).toContainText("Updated test case id:");
  await expect(page.getByTestId("test-case-selection")).toContainText(updatedTitle);
});

test("phase2 test-runs: execute pass via UI", async ({ page }) => {
  const project = await createProject(page);

  await page.getByTestId("test-case-project").selectOption({
    label: `${project.key} - ${project.name}`
  });
  await page.getByTestId("test-case-title").fill("Pass flow case");
  await page.getByTestId("test-case-steps").fill("Open page\nVerify data");
  await page.getByTestId("test-case-submit").click();
  await expect(page.getByTestId("test-case-created-id")).toContainText("Created test case id:");

  const firstCaseCheckbox = page.locator("[data-testid^='test-case-checkbox-']").first();
  await firstCaseCheckbox.check();

  await page.getByTestId("test-run-name").fill("Pass run");
  await page.getByTestId("test-run-submit").click();
  await expect(page.getByTestId("test-run-created-id")).toContainText("Created test run id:");

  await page.getByTestId("execution-pass-submit").click();
  await expect(page.getByTestId("execution-result")).toContainText("Execution saved: PASS");
  await expect(page.getByTestId("execution-linked-bug")).toHaveCount(0);
});

test("phase2 bugs: change status via UI", async ({ page }) => {
  const project = await createProject(page);
  const bugTitle = `Status bug ${Date.now()}`;

  await page.getByTestId("bug-project").selectOption({
    label: `${project.key} - ${project.name}`
  });
  await page.getByTestId("bug-title").fill(bugTitle);
  await page.getByTestId("bug-description").fill("Status update scenario");
  await page.getByTestId("bug-severity").selectOption("S2");
  await page.getByTestId("bug-priority").selectOption("P2");
  await page.getByTestId("bug-submit").click();
  await expect(page.getByTestId("bug-created-id")).toContainText("Created bug id:");

  await page.getByTestId("bug-status-item").selectOption({
    label: `${bugTitle} (OPEN)`
  });
  await page.getByTestId("bug-status-value").selectOption("IN_PROGRESS");
  await page.getByTestId("bug-status-submit").click();

  await expect(page.getByTestId("bug-status-updated")).toContainText("IN_PROGRESS");
});
