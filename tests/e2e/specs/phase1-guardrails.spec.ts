import { APIRequestContext, expect, Page, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@krud.local").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin12345!";
const VIEWER_EMAIL = (process.env.VIEWER_EMAIL ?? "viewer@krud.local").toLowerCase();
const VIEWER_PASSWORD = process.env.VIEWER_PASSWORD ?? "Viewer12345!";

async function assertUserLogin(
  request: APIRequestContext,
  input: {
    email: string;
    password: string;
  }
) {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: input.email,
      password: input.password
    }
  });
  expect(login.ok(), `User ${input.email} is missing. Run \`npm run db:seed\`.`).toBeTruthy();
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("auth-email-badge")).toContainText(email);
}

function randomProjectIdentity() {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return {
    name: `Guard-${suffix}`,
    key: `G${suffix}`
  };
}

test.beforeAll(async ({ request }) => {
  await assertUserLogin(request, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  await assertUserLogin(request, {
    email: VIEWER_EMAIL,
    password: VIEWER_PASSWORD
  });
});

test("phase1 auth: logout clears session in UI", async ({ page }) => {
  await loginViaUi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.getByTestId("logout-button").click();
  await expect(page.getByTestId("login-form")).toBeVisible();
  await expect(page.getByTestId("auth-email-badge")).toHaveCount(0);
});

test("phase1 permissions: viewer cannot create project", async ({ page }) => {
  await loginViaUi(page, VIEWER_EMAIL, VIEWER_PASSWORD);

  const project = randomProjectIdentity();
  await page.getByTestId("project-name").fill(project.name);
  await page.getByTestId("project-key").fill(project.key);
  await page.getByTestId("project-submit").click();

  await expect(page.getByTestId("form-error")).toContainText(/Forbidden/i);
});

test("phase1 validation: required project and bug fields are blocked", async ({ page }) => {
  await loginViaUi(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  await page.getByTestId("project-name").fill("");
  await page.getByTestId("project-key").fill("");
  await page.getByTestId("project-submit").click();
  await expect(page.getByTestId("form-error")).toContainText("Project name is required");

  const project = randomProjectIdentity();
  await page.getByTestId("project-name").fill(project.name);
  await page.getByTestId("project-key").fill(project.key);
  await page.getByTestId("project-submit").click();
  await expect(page.getByTestId("project-created-key")).toContainText(project.key);

  await page.getByTestId("bug-project").selectOption({
    label: `${project.key} - ${project.name}`
  });
  await page.getByTestId("bug-title").fill("");
  await page.getByTestId("bug-submit").click();
  await expect(page.getByTestId("form-error")).toContainText("Bug title is required");
});
