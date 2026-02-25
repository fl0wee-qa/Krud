import { APIRequestContext, expect, Page, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@krud.local").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin12345!";

async function loginAdminApi(request: APIRequestContext) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });
  expect(response.ok(), "Admin user is missing. Run `npm run db:seed`.").toBeTruthy();
  return (await response.json()) as { accessToken: string };
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
    name: `Specs-${suffix}`,
    key: `S${suffix}`
  };
}

test("phase6 specs ui: create and update spec version", async ({ request, page }) => {
  const { accessToken } = await loginAdminApi(request);
  const project = randomProject();

  const createProjectResponse = await request.post(`${API_URL}/projects`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    data: {
      name: project.name,
      key: project.key,
      methodology: "SCRUM"
    }
  });
  expect(createProjectResponse.ok()).toBeTruthy();

  await loginViaUi(page);
  await page.goto("/specs");

  await page.getByTestId("spec-project").selectOption({
    label: `${project.key} - ${project.name}`
  });

  const title = `Auth Spec ${Date.now()}`;
  await page.getByTestId("spec-title").fill(title);
  await page.getByTestId("spec-markdown").fill("## Auth\n- Login\n- Refresh token");
  await page.getByTestId("spec-submit").click();

  await expect(page.getByTestId("spec-created-id")).toContainText("Created spec id:");
  await expect(page.getByTestId("spec-list")).toContainText(title);
  await expect(page.getByTestId("spec-coverage")).toContainText("Total Specs");

  await page.getByTestId("spec-update-id").selectOption({
    label: title
  });
  await page.getByTestId("spec-update-markdown").fill("## Auth v2\n- Login\n- Refresh token\n- Device audit");
  await page.getByTestId("spec-update-submit").click();

  await expect(page.getByTestId("spec-updated-id")).toContainText("Updated spec id:");
});
