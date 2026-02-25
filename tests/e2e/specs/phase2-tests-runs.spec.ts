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
    name: `Phase2-${suffix}`,
    key: `T${suffix}`
  };
}

test.beforeEach(async ({ request, page }) => {
  await assertAdminLogin(request);
  await loginViaUi(page);
});

test("phase2 tests: create test case, run, fail and auto-create bug via UI", async ({ page }) => {
  const project = randomProject();

  await page.getByTestId("project-name").fill(project.name);
  await page.getByTestId("project-key").fill(project.key);
  await page.getByTestId("project-methodology").selectOption("SCRUM");
  await page.getByTestId("project-submit").click();
  await expect(page.getByTestId("project-created-key")).toContainText(project.key);

  await page.getByTestId("test-case-project").selectOption({
    label: `${project.key} - ${project.name}`
  });
  await page.getByTestId("test-case-title").fill("Phase2 case smoke");
  await page.getByTestId("test-case-steps").fill("Open project\nRun test\nCheck output");
  await page.getByTestId("test-case-submit").click();
  await expect(page.getByTestId("test-case-created-id")).toContainText("Created test case id:");

  const firstCaseCheckbox = page.locator("[data-testid^='test-case-checkbox-']").first();
  await expect(firstCaseCheckbox).toBeVisible();
  await firstCaseCheckbox.check();

  await page.getByTestId("test-run-name").fill("Phase2 run smoke");
  await page.getByTestId("test-run-submit").click();
  await expect(page.getByTestId("test-run-created-id")).toContainText("Created test run id:");

  await expect(page.getByTestId("execution-run")).toBeVisible();
  await expect(page.getByTestId("execution-case")).toBeVisible();
  await page.getByTestId("execution-submit").click();

  const linkedBug = page.getByTestId("execution-linked-bug");
  await expect(linkedBug).toContainText("Linked bug id:");
  await expect(linkedBug).not.toContainText("undefined");
});
