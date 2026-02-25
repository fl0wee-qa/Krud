import { APIRequestContext, expect, Page, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@krud.local").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin12345!";
const DEVELOPER_EMAIL = (process.env.DEVELOPER_EMAIL ?? "developer@krud.local").toLowerCase();
const DEVELOPER_PASSWORD = process.env.DEVELOPER_PASSWORD ?? "Developer12345!";

async function ensureDeveloperUser(request: APIRequestContext) {
  const tryLogin = () =>
    request.post(`${API_URL}/auth/login`, {
      data: {
        email: DEVELOPER_EMAIL,
        password: DEVELOPER_PASSWORD
      }
    });

  const login = await tryLogin();
  if (login.ok()) {
    return;
  }

  await request.post(`${API_URL}/auth/register`, {
    data: {
      email: DEVELOPER_EMAIL,
      password: DEVELOPER_PASSWORD,
      role: "DEVELOPER",
      name: "Krud Developer"
    }
  });

  const loginAfterRegister = await tryLogin();
  expect(loginAfterRegister.ok(), "Developer user is missing and registration failed.").toBeTruthy();
}

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
    name: `Phase3-${suffix}`,
    key: `Q${suffix}`
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

async function createBug(page: Page, project: { key: string; name: string }, title: string) {
  await page.getByTestId("bug-project").selectOption({
    label: `${project.key} - ${project.name}`
  });
  await page.getByTestId("bug-title").fill(title);
  await page.getByTestId("bug-description").fill(`Bug created for ${title}`);
  await page.getByTestId("bug-severity").selectOption("S2");
  await page.getByTestId("bug-priority").selectOption("P2");
  await page.getByTestId("bug-submit").click();
  await expect(page.getByTestId("bug-created-id")).toContainText("Created bug id:");
}

test.beforeAll(async ({ request }) => {
  await ensureDeveloperUser(request);
});

test.beforeEach(async ({ request, page }) => {
  await assertAdminLogin(request);
  await loginViaUi(page);
});

test("phase3 test-cases: link bug to test case via UI", async ({ page }) => {
  const project = await createProject(page);
  const caseTitle = "Link target case";

  await page.getByTestId("test-case-project").selectOption({
    label: `${project.key} - ${project.name}`
  });
  await page.getByTestId("test-case-title").fill(caseTitle);
  await page.getByTestId("test-case-steps").fill("Open page\nCheck response");
  await page.getByTestId("test-case-submit").click();
  const caseCreated = page.getByTestId("test-case-created-id");
  await expect(caseCreated).toContainText("Created test case id:");
  const caseId = (await caseCreated.textContent())?.split(":")[1]?.trim() ?? "";

  await page.getByTestId("bug-project").selectOption({
    label: `${project.key} - ${project.name}`
  });
  await page.getByTestId("bug-title").fill("Linked bug from phase3");
  await page.getByTestId("bug-description").fill("Bug linked to test case");
  await page.getByTestId("bug-linked-case").selectOption({
    label: caseTitle
  });
  await page.getByTestId("bug-submit").click();

  await expect(page.getByTestId("bug-created-linked-case")).toContainText(caseId);
});

test("phase3 bugs: assign developer via UI", async ({ page }) => {
  const project = await createProject(page);
  const bugTitle = `Assign flow ${Date.now()}`;

  await createBug(page, project, bugTitle);

  await page.getByTestId("bug-assign-item").selectOption({
    label: bugTitle
  });
  await page.getByTestId("bug-assign-developer").selectOption({
    label: DEVELOPER_EMAIL
  });
  await page.getByTestId("bug-assign-submit").click();

  await expect(page.getByTestId("bug-assigned-to")).toContainText(DEVELOPER_EMAIL);
});

test("phase3 bugs: filter with query via UI", async ({ page }) => {
  const project = await createProject(page);
  const inProgressTitle = `Query in progress ${Date.now()}`;
  const openTitle = `Query open ${Date.now()}`;

  await createBug(page, project, inProgressTitle);
  await page.getByTestId("bug-status-item").selectOption({
    label: `${inProgressTitle} (OPEN)`
  });
  await page.getByTestId("bug-status-value").selectOption("IN_PROGRESS");
  await page.getByTestId("bug-status-submit").click();
  await expect(page.getByTestId("bug-status-updated")).toContainText("IN_PROGRESS");

  await createBug(page, project, openTitle);
  await page.getByTestId("bug-query-input").fill("status = \"OPEN\"");
  await page.getByTestId("bug-query-submit").click();

  await expect(page.getByTestId("bug-query-results")).toContainText(openTitle);
  await expect(page.getByTestId("bug-query-results")).not.toContainText(inProgressTitle);
});
