import { APIRequestContext, expect, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@krud.local").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin12345!";

type AuthLoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    role: "ADMIN" | "QA" | "DEVELOPER" | "VIEWER";
  };
};

async function loginAdmin(request: APIRequestContext): Promise<AuthLoginResponse> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });
  expect(response.ok(), "Admin user is missing. Run `npm run db:seed`.").toBeTruthy();
  return (await response.json()) as AuthLoginResponse;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

function randomProject() {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return {
    name: `Core-${suffix}`,
    key: `C${suffix}`
  };
}

async function createProject(request: APIRequestContext, token: string, methodology: "SCRUM" | "KANBAN" = "SCRUM") {
  const identity = randomProject();
  const response = await request.post(`${API_URL}/projects`, {
    headers: authHeaders(token),
    data: {
      name: identity.name,
      key: identity.key,
      methodology
    }
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as {
    id: string;
    key: string;
    methodology: "SCRUM" | "KANBAN";
  };
}

test("auth: token expiration refresh", async ({ request }) => {
  const login = await loginAdmin(request);

  const refreshResponse = await request.post(`${API_URL}/auth/refresh`, {
    data: {
      refreshToken: login.refreshToken
    }
  });
  expect(refreshResponse.ok()).toBeTruthy();

  const refreshed = (await refreshResponse.json()) as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number | string;
  };
  expect(refreshed.accessToken.length).toBeGreaterThan(20);
  expect(refreshed.refreshToken.length).toBeGreaterThan(20);
  expect(Number(refreshed.expiresIn)).toBeGreaterThan(0);

  const protectedCall = await request.get(`${API_URL}/projects`, {
    headers: authHeaders(refreshed.accessToken)
  });
  expect(protectedCall.ok()).toBeTruthy();
});

test("projects: change methodology scrum->kanban", async ({ request }) => {
  const login = await loginAdmin(request);
  const project = await createProject(request, login.accessToken, "SCRUM");

  const response = await request.patch(`${API_URL}/projects/${project.id}/methodology/KANBAN`, {
    headers: authHeaders(login.accessToken)
  });
  expect(response.ok()).toBeTruthy();
  const updated = (await response.json()) as {
    methodology: "SCRUM" | "KANBAN";
  };
  expect(updated.methodology).toBe("KANBAN");
});

test("projects: configure workflow", async ({ request }) => {
  const login = await loginAdmin(request);
  const project = await createProject(request, login.accessToken);

  const response = await request.patch(`${API_URL}/projects/${project.id}/settings`, {
    headers: authHeaders(login.accessToken),
    data: {
      workflowConfig: {
        bugStatuses: [
          "OPEN",
          "IN_PROGRESS",
          "READY_FOR_QA",
          "CLOSED"
        ],
        transitions: [
          "OPEN->IN_PROGRESS",
          "IN_PROGRESS->READY_FOR_QA"
        ]
      },
      sprintDurationDays: 10,
      tags: [
        "backend",
        "critical"
      ],
      modules: {
        tests: true,
        bugs: true,
        specs: false,
        agile: true
      }
    }
  });
  expect(response.ok()).toBeTruthy();
  const updated = (await response.json()) as {
    sprintDurationDays: number;
    tags: string[];
    modules: {
      specs: boolean;
    };
    workflowConfig: {
      transitions: string[];
    };
  };
  expect(updated.sprintDurationDays).toBe(10);
  expect(updated.tags).toContain("critical");
  expect(updated.modules.specs).toBe(false);
  expect(updated.workflowConfig.transitions).toContain("OPEN->IN_PROGRESS");
});

test("specs: create specification", async ({ request }) => {
  const login = await loginAdmin(request);
  const project = await createProject(request, login.accessToken);

  const response = await request.post(`${API_URL}/specs`, {
    headers: authHeaders(login.accessToken),
    data: {
      projectId: project.id,
      title: "Authentication rules",
      markdown: "# Auth\n- Users must login",
      attachments: {
        source: "phase6"
      }
    }
  });
  expect(response.ok()).toBeTruthy();
  const spec = (await response.json()) as {
    title: string;
    versions: Array<{ version: number }>;
  };
  expect(spec.title).toBe("Authentication rules");
  expect(spec.versions.length).toBeGreaterThanOrEqual(1);
  expect(spec.versions[0]?.version).toBe(1);
});

test("specs: versioning history", async ({ request }) => {
  const login = await loginAdmin(request);
  const project = await createProject(request, login.accessToken);

  const createResponse = await request.post(`${API_URL}/specs`, {
    headers: authHeaders(login.accessToken),
    data: {
      projectId: project.id,
      title: "Payments spec",
      markdown: "# v1"
    }
  });
  expect(createResponse.ok()).toBeTruthy();
  const created = (await createResponse.json()) as { id: string };

  const updateResponse = await request.patch(`${API_URL}/specs/${created.id}`, {
    headers: authHeaders(login.accessToken),
    data: {
      markdown: "# v2\n- Added refunds"
    }
  });
  expect(updateResponse.ok()).toBeTruthy();
  const updated = (await updateResponse.json()) as {
    versions: Array<{ version: number }>;
  };

  const versions = updated.versions.map((item) => item.version);
  expect(versions).toContain(1);
  expect(versions).toContain(2);
});

test("specs: coverage view", async ({ request }) => {
  const login = await loginAdmin(request);
  const project = await createProject(request, login.accessToken);

  const specAResponse = await request.post(`${API_URL}/specs`, {
    headers: authHeaders(login.accessToken),
    data: {
      projectId: project.id,
      title: "Spec A",
      markdown: "# A"
    }
  });
  const specBResponse = await request.post(`${API_URL}/specs`, {
    headers: authHeaders(login.accessToken),
    data: {
      projectId: project.id,
      title: "Spec B",
      markdown: "# B"
    }
  });
  expect(specAResponse.ok()).toBeTruthy();
  expect(specBResponse.ok()).toBeTruthy();

  const specA = (await specAResponse.json()) as { id: string };
  const testCaseResponse = await request.post(`${API_URL}/tests/cases`, {
    headers: authHeaders(login.accessToken),
    data: {
      projectId: project.id,
      title: "Coverage test case",
      steps: [
        "Open app",
        "Check behavior"
      ],
      expected: "Visible",
      priority: "P2",
      status: "READY",
      type: "FUNCTIONAL",
      linkedSpecId: specA.id
    }
  });
  expect(testCaseResponse.ok()).toBeTruthy();

  const coverageResponse = await request.get(`${API_URL}/specs/coverage/${project.id}`, {
    headers: authHeaders(login.accessToken)
  });
  expect(coverageResponse.ok()).toBeTruthy();
  const coverage = (await coverageResponse.json()) as {
    totalSpecs: number;
    coveredSpecs: number;
    uncoveredSpecs: number;
  };
  expect(coverage.totalSpecs).toBe(2);
  expect(coverage.coveredSpecs).toBe(1);
  expect(coverage.uncoveredSpecs).toBe(1);
});

test("negative: invalid enum values", async ({ request }) => {
  const login = await loginAdmin(request);
  const identity = randomProject();

  const response = await request.post(`${API_URL}/projects`, {
    headers: authHeaders(login.accessToken),
    data: {
      name: identity.name,
      key: identity.key,
      methodology: "WATERFALL"
    }
  });
  expect(response.status()).toBe(400);
  const body = (await response.json()) as {
    message: string | string[];
  };
  const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
  expect(message).toContain("methodology");
});
