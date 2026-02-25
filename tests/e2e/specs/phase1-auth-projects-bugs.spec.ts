import { APIRequestContext, expect, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@krud.local").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin12345!";

async function assertAdminLogin(request: APIRequestContext) {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });
  expect(login.ok(), "Admin user is missing. Run `npm run db:seed`.").toBeTruthy();
}

function randomProjectIdentity() {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return {
    name: `Phase1-${suffix}`,
    key: `K${suffix}`
  };
}

test.beforeEach(async ({ request, page }) => {
  await assertAdminLogin(request);
  await page.goto("/");
  await page.getByTestId("login-email").fill(ADMIN_EMAIL);
  await page.getByTestId("login-password").fill(ADMIN_PASSWORD);
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("auth-email-badge")).toContainText(ADMIN_EMAIL);
});

test("phase1 auth: admin can login via UI", async ({ page }) => {
  await expect(page.getByTestId("auth-email-badge")).toContainText("ADMIN");
});

test("phase1 projects: admin creates project via UI", async ({ page }) => {
  const identity = randomProjectIdentity();

  await page.getByTestId("project-name").fill(identity.name);
  await page.getByTestId("project-key").fill(identity.key);
  await page.getByTestId("project-methodology").selectOption("SCRUM");
  await page.getByTestId("project-submit").click();

  await expect(page.getByTestId("project-created-key")).toContainText(identity.key);
});

test("phase1 bugs: admin creates bug via UI", async ({ page }) => {
  const identity = randomProjectIdentity();
  await page.getByTestId("project-name").fill(identity.name);
  await page.getByTestId("project-key").fill(identity.key);
  await page.getByTestId("project-methodology").selectOption("KANBAN");
  await page.getByTestId("project-submit").click();
  await expect(page.getByTestId("project-created-key")).toContainText(identity.key);

  await page.getByTestId("bug-project").selectOption({
    label: `${identity.key} - ${identity.name}`
  });
  await page.getByTestId("bug-title").fill("UI bug creation smoke");
  await page.getByTestId("bug-description").fill("Created in Phase 1 UI test");
  await page.getByTestId("bug-severity").selectOption("S2");
  await page.getByTestId("bug-priority").selectOption("P2");
  await page.getByTestId("bug-submit").click();

  const bugId = page.getByTestId("bug-created-id");
  await expect(bugId).toContainText("Created bug id:");
  await expect(bugId).not.toContainText("undefined");
});
