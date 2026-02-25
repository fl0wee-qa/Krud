const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export type DashboardSummary = {
  openBugs: number;
  sprintProgress: number;
  testCoverage: number;
  recentActivity: number;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "QA" | "DEVELOPER" | "VIEWER";
};

export type LoginResult = AuthTokens & {
  user: AuthUser;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "QA" | "DEVELOPER" | "VIEWER";
};

export type Project = {
  id: string;
  name: string;
  key: string;
  methodology: "SCRUM" | "KANBAN";
};

export type Bug = {
  id: string;
  projectId: string;
  title: string;
  severity: "S1" | "S2" | "S3" | "S4";
  priority: "P1" | "P2" | "P3" | "P4";
  status: "OPEN" | "IN_PROGRESS" | "READY_FOR_QA" | "CLOSED";
  linkedTestCaseId?: string | null;
  assigneeId?: string | null;
  sprintId?: string | null;
  columnId?: string | null;
};

export type TestCase = {
  id: string;
  projectId: string;
  title: string;
  status: "DRAFT" | "READY" | "DEPRECATED";
  type: "FUNCTIONAL" | "REGRESSION" | "SMOKE";
};

export type TestRunResult = {
  id: string;
  testRunId: string;
  testCaseId: string;
  result: "PASS" | "FAIL" | "BLOCKED";
  comment?: string;
  linkedBugId?: string | null;
};

export type TestRun = {
  id: string;
  projectId: string;
  name: string;
  executionDate: string;
  results: TestRunResult[];
};

export type Sprint = {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  startDate: string;
  endDate: string;
};

export type BoardColumn = {
  id: string;
  projectId: string;
  name: string;
  position: number;
  wipLimit?: number | null;
};

type RequestOptions = RequestInit & {
  token?: string;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (init?.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(", ");
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // Keep fallback message.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export const api = {
  health: () => request<{ status: string; timestamp: string }>("/health"),

  login: (email: string, password: string) =>
    request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password
      })
    }),

  getProjects: (token: string) =>
    request<Project[]>("/projects", {
      token
    }),

  createProject: (
    token: string,
    input: {
      name: string;
      key: string;
      methodology: "SCRUM" | "KANBAN";
    }
  ) =>
    request<Project>("/projects", {
      method: "POST",
      token,
      body: JSON.stringify(input)
    }),

  createBug: (
    token: string,
    input: {
      projectId: string;
      title: string;
      description?: string;
      severity: "S1" | "S2" | "S3" | "S4";
      priority: "P1" | "P2" | "P3" | "P4";
      linkedTestCaseId?: string;
      tags?: string[];
    }
  ) =>
    request<Bug>("/bugs", {
      method: "POST",
      token,
      body: JSON.stringify(input)
    }),

  createTestCase: (
    token: string,
    input: {
      projectId: string;
      title: string;
      description?: string;
      preconditions?: string;
      steps: string[];
      expected?: string;
      priority: "P1" | "P2" | "P3" | "P4";
      status?: "DRAFT" | "READY" | "DEPRECATED";
      type: "FUNCTIONAL" | "REGRESSION" | "SMOKE";
      tags?: string[];
    }
  ) =>
    request<TestCase>("/tests/cases", {
      method: "POST",
      token,
      body: JSON.stringify(input)
    }),

  listTestCases: (token: string, projectId: string) =>
    request<TestCase[]>(`/tests/cases?projectId=${encodeURIComponent(projectId)}`, {
      token
    }),

  updateTestCase: (
    token: string,
    id: string,
    input: {
      title?: string;
      description?: string;
      steps?: string[];
      status?: "DRAFT" | "READY" | "DEPRECATED";
      tags?: string[];
    }
  ) =>
    request<TestCase>(`/tests/cases/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(input)
    }),

  createTestRun: (
    token: string,
    input: {
      projectId: string;
      name: string;
      executionDate: string;
      testCaseIds: string[];
    }
  ) =>
    request<TestRun>("/tests/runs", {
      method: "POST",
      token,
      body: JSON.stringify(input)
    }),

  listTestRuns: (token: string, projectId: string) =>
    request<TestRun[]>(`/tests/runs?projectId=${encodeURIComponent(projectId)}`, {
      token
    }),

  listBugs: (token: string, projectId: string) =>
    request<Bug[]>(`/bugs?projectId=${encodeURIComponent(projectId)}`, {
      token
    }),

  queryBugs: (
    token: string,
    input: {
      projectId: string;
      query?: string;
    }
  ) =>
    request<Bug[]>("/query/bugs", {
      method: "POST",
      token,
      body: JSON.stringify(input)
    }),

  updateBug: (
    token: string,
    id: string,
    input: {
      title?: string;
      description?: string;
      severity?: "S1" | "S2" | "S3" | "S4";
      priority?: "P1" | "P2" | "P3" | "P4";
      status?: "OPEN" | "IN_PROGRESS" | "READY_FOR_QA" | "CLOSED";
      assigneeId?: string;
      tags?: string[];
    }
  ) =>
    request<Bug>(`/bugs/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(input)
    }),

  listUsers: (
    token: string,
    role?: "ADMIN" | "QA" | "DEVELOPER" | "VIEWER"
  ) =>
    request<User[]>(`/users${role ? `?role=${encodeURIComponent(role)}` : ""}`, {
      token
    }),

  createSprint: (
    token: string,
    input: {
      projectId: string;
      name: string;
      goal?: string;
      startDate: string;
      endDate: string;
    }
  ) =>
    request<Sprint>("/agile/sprints", {
      method: "POST",
      token,
      body: JSON.stringify(input)
    }),

  listSprints: (token: string, projectId: string) =>
    request<Sprint[]>(`/agile/sprints?projectId=${encodeURIComponent(projectId)}`, {
      token
    }),

  createBoardColumn: (
    token: string,
    input: {
      projectId: string;
      name: string;
      position: number;
      wipLimit?: number;
    }
  ) =>
    request<BoardColumn>("/agile/columns", {
      method: "POST",
      token,
      body: JSON.stringify(input)
    }),

  listBoardColumns: (token: string, projectId: string) =>
    request<BoardColumn[]>(`/agile/columns?projectId=${encodeURIComponent(projectId)}`, {
      token
    }),

  moveBug: (
    token: string,
    input: {
      bugId: string;
      sprintId?: string;
      columnId?: string;
    }
  ) =>
    request<Bug>("/agile/move-bug", {
      method: "PATCH",
      token,
      body: JSON.stringify(input)
    }),

  saveTestResult: (
    token: string,
    input: {
      testRunId: string;
      testCaseId: string;
      result: "PASS" | "FAIL" | "BLOCKED";
      comment?: string;
      autoCreateBug?: {
        enabled: boolean;
        title?: string;
        severity?: "S1" | "S2" | "S3" | "S4";
        priority?: "P1" | "P2" | "P3" | "P4";
      };
    }
  ) =>
    request<TestRunResult>(`/tests/runs/${input.testRunId}/results`, {
      method: "POST",
      token,
      body: JSON.stringify({
        testCaseId: input.testCaseId,
        result: input.result,
        comment: input.comment,
        autoCreateBug: input.autoCreateBug
      })
    }),

  dashboardSummary: async (): Promise<DashboardSummary> => ({
    openBugs: 12,
    sprintProgress: 64,
    testCoverage: 71,
    recentActivity: 18
  })
};

export { ApiError };
