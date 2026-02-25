"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, ShieldCheck, TestTube2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { api, ApiError, AuthUser, BoardColumn, Bug, Project, Sprint, TestCase, TestRun, User } from "@/lib/api";
import { useUiStore } from "@/lib/ui-store";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must have at least 8 characters")
});

const projectSchema = z.object({
  name: z.string().min(2, "Project name is required").max(80),
  key: z.string().min(2, "Project key is required").max(8).regex(/^[A-Za-z0-9]+$/),
  methodology: z.enum([
    "SCRUM",
    "KANBAN"
  ])
});

const bugSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(3, "Bug title is required").max(160),
  description: z.string().max(400).optional(),
  linkedTestCaseId: z.string().uuid().optional(),
  severity: z.enum([
    "S1",
    "S2",
    "S3",
    "S4"
  ]),
  priority: z.enum([
    "P1",
    "P2",
    "P3",
    "P4"
  ])
});

const testCaseSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(3, "Test case title is required").max(160),
  steps: z.array(z.string().min(1)).min(1, "At least one step is required")
});

const testRunSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(3, "Run name is required"),
  executionDate: z.string().min(10, "Execution date is required"),
  testCaseIds: z.array(z.string().uuid()).min(1, "Select at least one case")
});

const sprintSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(3, "Sprint name is required").max(80),
  goal: z.string().max(200).optional(),
  startDate: z.string().min(10, "Start date is required"),
  endDate: z.string().min(10, "End date is required")
});

const boardColumnSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2, "Column name is required").max(40),
  position: z.number().int().min(0),
  wipLimit: z.number().int().min(1).optional()
});

const TOKEN_KEY = "krud-access-token";
const USER_KEY = "krud-user";

export function Phase1Workbench() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("admin@krud.local");
  const [loginPassword, setLoginPassword] = useState("Admin12345!");

  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectMethodology, setProjectMethodology] = useState<"SCRUM" | "KANBAN">("SCRUM");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugSeverity, setBugSeverity] = useState<"S1" | "S2" | "S3" | "S4">("S2");
  const [bugPriority, setBugPriority] = useState<"P1" | "P2" | "P3" | "P4">("P2");
  const [bugLinkedCaseId, setBugLinkedCaseId] = useState("");

  const [caseTitle, setCaseTitle] = useState("");
  const [caseSteps, setCaseSteps] = useState("Open app\nPerform action\nVerify");
  const [runName, setRunName] = useState("Phase2 Run");
  const [runDate, setRunDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [editCaseId, setEditCaseId] = useState("");
  const [editCaseTitle, setEditCaseTitle] = useState("");
  const [editCaseStatus, setEditCaseStatus] = useState<"DRAFT" | "READY" | "DEPRECATED">("READY");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [selectedRunCaseId, setSelectedRunCaseId] = useState("");
  const [selectedBugId, setSelectedBugId] = useState("");
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [bugStatus, setBugStatus] = useState<"OPEN" | "IN_PROGRESS" | "READY_FOR_QA" | "CLOSED">("OPEN");
  const [bugQuery, setBugQuery] = useState("status = \"OPEN\"");
  const [bugQueryResults, setBugQueryResults] = useState<Bug[]>([]);
  const [sprintName, setSprintName] = useState("Sprint 1");
  const [sprintGoal, setSprintGoal] = useState("Stabilize critical flows");
  const [sprintStartDate, setSprintStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sprintEndDate, setSprintEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [columnName, setColumnName] = useState("In Progress");
  const [columnPosition, setColumnPosition] = useState("1");
  const [columnWipLimit, setColumnWipLimit] = useState("2");
  const [selectedBoardBugId, setSelectedBoardBugId] = useState("");
  const [selectedBoardColumnId, setSelectedBoardColumnId] = useState("");
  const [selectedMoveSprintId, setSelectedMoveSprintId] = useState("");

  const [projectSuccess, setProjectSuccess] = useState<string | null>(null);
  const [bugSuccess, setBugSuccess] = useState<string | null>(null);
  const [bugLinkSuccess, setBugLinkSuccess] = useState<string | null>(null);
  const [bugStatusSuccess, setBugStatusSuccess] = useState<string | null>(null);
  const [bugAssigneeSuccess, setBugAssigneeSuccess] = useState<string | null>(null);
  const [sprintSuccess, setSprintSuccess] = useState<string | null>(null);
  const [columnSuccess, setColumnSuccess] = useState<string | null>(null);
  const [boardMoveSuccess, setBoardMoveSuccess] = useState<string | null>(null);
  const [caseSuccess, setCaseSuccess] = useState<string | null>(null);
  const [caseUpdateSuccess, setCaseUpdateSuccess] = useState<string | null>(null);
  const [runSuccess, setRunSuccess] = useState<string | null>(null);
  const [execResultSuccess, setExecResultSuccess] = useState<"PASS" | "FAIL" | "BLOCKED" | null>(null);
  const [execLinkedBugId, setExecLinkedBugId] = useState<string | null>(null);

  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = window.localStorage.getItem(TOKEN_KEY);
    const u = window.localStorage.getItem(USER_KEY);
    if (t) {
      setToken(t);
    }
    if (u) {
      try {
        setUser(JSON.parse(u) as AuthUser);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("theme-dark");
    } else {
      html.classList.remove("theme-dark");
    }
  }, [
    theme
  ]);

  const healthQuery = useQuery({ queryKey: [ "health" ], queryFn: api.health });
  const projectsQuery = useQuery({
    queryKey: [ "projects", token ],
    queryFn: () => api.getProjects(token as string),
    enabled: Boolean(token)
  });
  const testCasesQuery = useQuery({
    queryKey: [ "cases", token, selectedProjectId ],
    queryFn: () => api.listTestCases(token as string, selectedProjectId),
    enabled: Boolean(token && selectedProjectId)
  });
  const testRunsQuery = useQuery({
    queryKey: [ "runs", token, selectedProjectId ],
    queryFn: () => api.listTestRuns(token as string, selectedProjectId),
    enabled: Boolean(token && selectedProjectId)
  });
  const bugsQuery = useQuery({
    queryKey: [ "bugs", token, selectedProjectId ],
    queryFn: () => api.listBugs(token as string, selectedProjectId),
    enabled: Boolean(token && selectedProjectId)
  });
  const developersQuery = useQuery({
    queryKey: [ "users", token, "DEVELOPER" ],
    queryFn: () => api.listUsers(token as string, "DEVELOPER"),
    enabled: Boolean(token)
  });
  const sprintsQuery = useQuery({
    queryKey: [ "sprints", token, selectedProjectId ],
    queryFn: () => api.listSprints(token as string, selectedProjectId),
    enabled: Boolean(token && selectedProjectId)
  });
  const columnsQuery = useQuery({
    queryKey: [ "columns", token, selectedProjectId ],
    queryFn: () => api.listBoardColumns(token as string, selectedProjectId),
    enabled: Boolean(token && selectedProjectId)
  });

  useEffect(() => {
    if (!projectsQuery.data || projectsQuery.data.length === 0) {
      setSelectedProjectId("");
      return;
    }
    if (!projectsQuery.data.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(projectsQuery.data[0].id);
    }
  }, [
    projectsQuery.data,
    selectedProjectId
  ]);

  useEffect(() => {
    if (!testRunsQuery.data || testRunsQuery.data.length === 0) {
      setSelectedRunId("");
      setSelectedRunCaseId("");
      return;
    }
    const run = testRunsQuery.data.find((r) => r.id === selectedRunId) ?? testRunsQuery.data[0];
    setSelectedRunId(run.id);
    if (!run.results.some((r) => r.testCaseId === selectedRunCaseId)) {
      setSelectedRunCaseId(run.results[0]?.testCaseId ?? "");
    }
  }, [
    testRunsQuery.data,
    selectedRunId,
    selectedRunCaseId
  ]);

  useEffect(() => {
    if (!testCasesQuery.data || testCasesQuery.data.length === 0) {
      setEditCaseId("");
      setEditCaseTitle("");
      setEditCaseStatus("READY");
      return;
    }

    const current = testCasesQuery.data.find((item) => item.id === editCaseId) ?? testCasesQuery.data[0];
    if (current.id !== editCaseId) {
      setEditCaseId(current.id);
    }
    setEditCaseTitle(current.title);
    setEditCaseStatus(current.status);
  }, [
    testCasesQuery.data,
    editCaseId
  ]);

  useEffect(() => {
    if (!bugsQuery.data || bugsQuery.data.length === 0) {
      setSelectedBugId("");
      setBugStatus("OPEN");
      return;
    }
    const current = bugsQuery.data.find((item) => item.id === selectedBugId) ?? bugsQuery.data[0];
    if (current.id !== selectedBugId) {
      setSelectedBugId(current.id);
    }
    setBugStatus(current.status);
    if (current.assigneeId) {
      setSelectedDeveloperId(current.assigneeId);
    }
  }, [
    bugsQuery.data,
    selectedBugId
  ]);

  useEffect(() => {
    if (!developersQuery.data || developersQuery.data.length === 0) {
      setSelectedDeveloperId("");
      return;
    }
    if (!developersQuery.data.some((item) => item.id === selectedDeveloperId)) {
      setSelectedDeveloperId(developersQuery.data[0].id);
    }
  }, [
    developersQuery.data,
    selectedDeveloperId
  ]);

  useEffect(() => {
    if (!bugsQuery.data || bugsQuery.data.length === 0) {
      setSelectedBoardBugId("");
      return;
    }
    if (!bugsQuery.data.some((item) => item.id === selectedBoardBugId)) {
      setSelectedBoardBugId(bugsQuery.data[0].id);
    }
  }, [
    bugsQuery.data,
    selectedBoardBugId
  ]);

  useEffect(() => {
    if (!columnsQuery.data || columnsQuery.data.length === 0) {
      setSelectedBoardColumnId("");
      return;
    }
    if (!columnsQuery.data.some((item) => item.id === selectedBoardColumnId)) {
      setSelectedBoardColumnId(columnsQuery.data[0].id);
    }
  }, [
    columnsQuery.data,
    selectedBoardColumnId
  ]);

  useEffect(() => {
    if (!sprintsQuery.data || sprintsQuery.data.length === 0) {
      setSelectedMoveSprintId("");
      return;
    }
    if (!sprintsQuery.data.some((item) => item.id === selectedMoveSprintId)) {
      setSelectedMoveSprintId(sprintsQuery.data[0].id);
    }
  }, [
    sprintsQuery.data,
    selectedMoveSprintId
  ]);

  useEffect(() => {
    setBugQueryResults([]);
    setSelectedBoardColumnId("");
    setSelectedMoveSprintId("");
    setSelectedBoardBugId("");
  }, [
    selectedProjectId
  ]);

  const panel = theme === "light" ? "bg-white/85 text-slate" : "bg-slate/70 text-slate-100";
  const input = theme === "light" ? "border-slate/20 bg-white text-slate" : "border-slate-100/20 bg-slate/30 text-slate-100";

  const loginMutation = useMutation({
    mutationFn: async () => {
      const parsed = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid login");
      }
      return api.login(parsed.data.email, parsed.data.password);
    },
    onSuccess: (res) => {
      setToken(res.accessToken);
      setUser(res.user);
      window.localStorage.setItem(TOKEN_KEY, res.accessToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Login failed")
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const parsed = projectSchema.safeParse({ name: projectName, key: projectKey.toUpperCase(), methodology: projectMethodology });
      if (!parsed.success || !token) {
        throw new Error(parsed.error?.issues[0]?.message ?? "Invalid project");
      }
      return api.createProject(token, parsed.data);
    },
    onSuccess: async (project) => {
      setProjectSuccess(project.key);
      await queryClient.invalidateQueries({ queryKey: [ "projects", token ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Project failed")
  });

  const createBug = useMutation({
    mutationFn: async () => {
      const parsed = bugSchema.safeParse({
        projectId: selectedProjectId,
        title: bugTitle,
        description: bugDescription || undefined,
        linkedTestCaseId: bugLinkedCaseId || undefined,
        severity: bugSeverity,
        priority: bugPriority
      });
      if (!parsed.success || !token) {
        throw new Error(parsed.error?.issues[0]?.message ?? "Invalid bug");
      }
      return api.createBug(token, parsed.data);
    },
    onSuccess: async (bug) => {
      setBugSuccess(bug.id);
      setBugLinkSuccess(bug.linkedTestCaseId ?? null);
      await queryClient.invalidateQueries({ queryKey: [ "bugs", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Bug failed")
  });

  const createCase = useMutation({
    mutationFn: async () => {
      const parsed = testCaseSchema.safeParse({
        projectId: selectedProjectId,
        title: caseTitle,
        steps: caseSteps.split("\n").map((x) => x.trim()).filter(Boolean)
      });
      if (!parsed.success || !token) {
        throw new Error(parsed.error?.issues[0]?.message ?? "Invalid test case");
      }
      return api.createTestCase(token, {
        ...parsed.data,
        expected: "Expected output visible",
        type: "FUNCTIONAL",
        priority: "P2",
        status: "READY"
      });
    },
    onSuccess: async (tc) => {
      setCaseSuccess(tc.id);
      await queryClient.invalidateQueries({ queryKey: [ "cases", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Test case failed")
  });

  const updateCase = useMutation({
    mutationFn: async () => {
      if (!token || !editCaseId) {
        throw new Error("Select test case to edit");
      }
      const parsed = z.string().min(3, "Test case title is required").max(160).safeParse(editCaseTitle.trim());
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid test case");
      }

      return api.updateTestCase(token, editCaseId, {
        title: parsed.data,
        status: editCaseStatus
      });
    },
    onSuccess: async (tc) => {
      setCaseUpdateSuccess(tc.id);
      await queryClient.invalidateQueries({ queryKey: [ "cases", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Test case update failed")
  });

  const createRun = useMutation({
    mutationFn: async () => {
      const parsed = testRunSchema.safeParse({ projectId: selectedProjectId, name: runName, executionDate: runDate, testCaseIds: selectedCaseIds });
      if (!parsed.success || !token) {
        throw new Error(parsed.error?.issues[0]?.message ?? "Invalid run");
      }
      return api.createTestRun(token, {
        ...parsed.data,
        executionDate: new Date(`${parsed.data.executionDate}T10:00:00.000Z`).toISOString()
      });
    },
    onSuccess: async (run) => {
      setRunSuccess(run.id);
      setSelectedRunId(run.id);
      setSelectedRunCaseId(run.results[0]?.testCaseId ?? "");
      await queryClient.invalidateQueries({ queryKey: [ "runs", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Run failed")
  });

  const executeFail = useMutation({
    mutationFn: async () => {
      if (!token || !selectedRunId || !selectedRunCaseId) {
        throw new Error("Select run and case result");
      }
      return api.saveTestResult(token, {
        testRunId: selectedRunId,
        testCaseId: selectedRunCaseId,
        result: "FAIL",
        comment: "Fail from UI flow",
        autoCreateBug: { enabled: true, title: "Auto bug from failed test", severity: "S2", priority: "P2" }
      });
    },
    onSuccess: async (r) => {
      setExecResultSuccess("FAIL");
      setExecLinkedBugId(r.linkedBugId ?? null);
      await queryClient.invalidateQueries({ queryKey: [ "runs", token, selectedProjectId ] });
      await queryClient.invalidateQueries({ queryKey: [ "bugs", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Execution failed")
  });

  const executePass = useMutation({
    mutationFn: async () => {
      if (!token || !selectedRunId || !selectedRunCaseId) {
        throw new Error("Select run and case result");
      }
      return api.saveTestResult(token, {
        testRunId: selectedRunId,
        testCaseId: selectedRunCaseId,
        result: "PASS",
        comment: "Pass from UI flow"
      });
    },
    onSuccess: async () => {
      setExecResultSuccess("PASS");
      setExecLinkedBugId(null);
      await queryClient.invalidateQueries({ queryKey: [ "runs", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Execution failed")
  });

  const updateBugStatus = useMutation({
    mutationFn: async () => {
      if (!token || !selectedBugId) {
        throw new Error("Select bug to update");
      }
      return api.updateBug(token, selectedBugId, {
        status: bugStatus
      });
    },
    onSuccess: async (bug) => {
      setBugStatusSuccess(`${bug.id}:${bug.status}`);
      await queryClient.invalidateQueries({ queryKey: [ "bugs", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Bug update failed")
  });

  const assignBug = useMutation({
    mutationFn: async () => {
      if (!token || !selectedBugId || !selectedDeveloperId) {
        throw new Error("Select bug and developer");
      }
      return api.updateBug(token, selectedBugId, {
        assigneeId: selectedDeveloperId
      });
    },
    onSuccess: async () => {
      const developer = developersQuery.data?.find((item) => item.id === selectedDeveloperId);
      setBugAssigneeSuccess(developer?.email ?? selectedDeveloperId);
      await queryClient.invalidateQueries({ queryKey: [ "bugs", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Bug assignment failed")
  });

  const queryBugs = useMutation({
    mutationFn: async () => {
      if (!token || !selectedProjectId) {
        throw new Error("Select project");
      }
      return api.queryBugs(token, {
        projectId: selectedProjectId,
        query: bugQuery.trim() || undefined
      });
    },
    onSuccess: (bugs) => {
      setBugQueryResults(bugs);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Bug query failed")
  });

  const createSprint = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Login required");
      }
      const parsed = sprintSchema.safeParse({
        projectId: selectedProjectId,
        name: sprintName,
        goal: sprintGoal || undefined,
        startDate: sprintStartDate,
        endDate: sprintEndDate
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid sprint");
      }
      return api.createSprint(token, {
        ...parsed.data,
        startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`).toISOString(),
        endDate: new Date(`${parsed.data.endDate}T23:59:59.999Z`).toISOString()
      });
    },
    onSuccess: async (sprint) => {
      setSprintSuccess(sprint.id);
      setSelectedMoveSprintId(sprint.id);
      await queryClient.invalidateQueries({ queryKey: [ "sprints", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Sprint creation failed")
  });

  const createBoardColumn = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Login required");
      }
      const parsed = boardColumnSchema.safeParse({
        projectId: selectedProjectId,
        name: columnName,
        position: Number(columnPosition),
        wipLimit: columnWipLimit.trim() ? Number(columnWipLimit) : undefined
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid column");
      }
      return api.createBoardColumn(token, parsed.data);
    },
    onSuccess: async (column) => {
      setColumnSuccess(column.id);
      setSelectedBoardColumnId(column.id);
      await queryClient.invalidateQueries({ queryKey: [ "columns", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Column creation failed")
  });

  const moveBugOnBoard = useMutation({
    mutationFn: async () => {
      if (!token || !selectedBoardBugId || !selectedBoardColumnId) {
        throw new Error("Select bug and column");
      }
      return api.moveBug(token, {
        bugId: selectedBoardBugId,
        columnId: selectedBoardColumnId,
        sprintId: selectedMoveSprintId || undefined
      });
    },
    onSuccess: async (bug) => {
      setBoardMoveSuccess(`${bug.id}:${bug.columnId ?? "unassigned"}`);
      await queryClient.invalidateQueries({ queryKey: [ "bugs", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Board move failed")
  });

  const selectedProject = useMemo(() => projectsQuery.data?.find((p) => p.id === selectedProjectId) ?? null, [ projectsQuery.data, selectedProjectId ]);
  const columnBugCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const bug of bugsQuery.data ?? []) {
      if (!bug.columnId) {
        continue;
      }
      counts.set(bug.columnId, (counts.get(bug.columnId) ?? 0) + 1);
    }
    return counts;
  }, [ bugsQuery.data ]);
  const runCases = useMemo(() => {
    const run = testRunsQuery.data?.find((r: TestRun) => r.id === selectedRunId);
    return run?.results ?? [];
  }, [ testRunsQuery.data, selectedRunId ]);

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto grid max-w-7xl gap-4">
        <header className={`rounded-2xl p-6 shadow-soft ${panel}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-pine">Krud Phase 1 + 2</p>
              <h1 className="mt-2 text-3xl font-semibold">Auth, Projects, Bugs, Test Cases, Test Runs</h1>
              <p className="mt-2 text-sm">API health: {healthQuery.data?.status ?? "checking..."}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={toggleTheme} className="rounded-xl border border-current/20 px-3 py-2 text-xs uppercase">Theme</button>
              {user ? <button type="button" data-testid="logout-button" onClick={logout} className="rounded-xl border border-current/20 px-3 py-2 text-xs uppercase">Logout</button> : null}
            </div>
          </div>
        </header>

        {error ? <div data-testid="form-error" className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${panel}`}><AlertCircle size={16} className="text-ember" /><p className="text-sm">{error}</p></div> : null}

        {!user ? (
          <section className={`rounded-2xl p-6 shadow-soft ${panel}`}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={18} className="text-pine" />Login</h2>
            <form data-testid="login-form" className="grid gap-3 md:max-w-md" onSubmit={(e) => { e.preventDefault(); setError(null); loginMutation.mutate(); }}>
              <input data-testid="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
              <input data-testid="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
              <button data-testid="login-submit" type="submit" className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white">Login</button>
            </form>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            <article className={`rounded-2xl p-6 shadow-soft ${panel}`}>
              <h2 className="mb-4 text-lg font-semibold">Session</h2>
              <p data-testid="auth-email-badge" className="rounded-xl bg-pine/15 px-3 py-2 text-sm font-medium">{user.email} ({user.role})</p>
            </article>

            <article className={`rounded-2xl p-6 shadow-soft ${panel}`}>
              <h2 className="mb-4 text-lg font-semibold">Create Project</h2>
              <form data-testid="project-form" className="grid gap-3" onSubmit={(e) => { e.preventDefault(); setError(null); createProject.mutate(); }}>
                <input data-testid="project-name" placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <input data-testid="project-key" placeholder="Key" value={projectKey} onChange={(e) => setProjectKey(e.target.value.toUpperCase())} className={`w-full rounded-xl border px-3 py-2 uppercase ${input}`} />
                <select data-testid="project-methodology" value={projectMethodology} onChange={(e) => setProjectMethodology(e.target.value as "SCRUM" | "KANBAN")} className={`w-full rounded-xl border px-3 py-2 ${input}`}>
                  <option value="SCRUM">SCRUM</option>
                  <option value="KANBAN">KANBAN</option>
                </select>
                <button data-testid="project-submit" type="submit" className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white">Create Project</button>
              </form>
              {projectSuccess ? <p data-testid="project-created-key" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Created project key: {projectSuccess}</p> : null}
            </article>

            <article className={`rounded-2xl p-6 shadow-soft md:col-span-2 ${panel}`}>
              <h2 className="mb-4 text-lg font-semibold">Create Bug</h2>
              <form data-testid="bug-form" className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); createBug.mutate(); }}>
                <select data-testid="bug-project" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>{(projectsQuery.data ?? []).map((p: Project) => <option key={p.id} value={p.id}>{p.key} - {p.name}</option>)}</select>
                <input data-testid="bug-title" placeholder="Bug title" value={bugTitle} onChange={(e) => setBugTitle(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <textarea data-testid="bug-description" placeholder="Description" value={bugDescription} onChange={(e) => setBugDescription(e.target.value)} className={`w-full rounded-xl border px-3 py-2 md:col-span-2 ${input}`} />
                <select data-testid="bug-linked-case" value={bugLinkedCaseId} onChange={(e) => setBugLinkedCaseId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 md:col-span-2 ${input}`}>
                  <option value="">No linked test case</option>
                  {(testCasesQuery.data ?? []).map((item: TestCase) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <select data-testid="bug-severity" value={bugSeverity} onChange={(e) => setBugSeverity(e.target.value as "S1" | "S2" | "S3" | "S4")} className={`w-full rounded-xl border px-3 py-2 ${input}`}><option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option><option value="S4">S4</option></select>
                <select data-testid="bug-priority" value={bugPriority} onChange={(e) => setBugPriority(e.target.value as "P1" | "P2" | "P3" | "P4")} className={`w-full rounded-xl border px-3 py-2 ${input}`}><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option><option value="P4">P4</option></select>
                <button data-testid="bug-submit" type="submit" disabled={!selectedProject} className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white md:col-span-2">Create Bug</button>
              </form>
              {bugSuccess ? <p data-testid="bug-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Created bug id: {bugSuccess}</p> : null}
              {bugLinkSuccess ? <p data-testid="bug-created-linked-case" className="mt-2 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Linked test case id: {bugLinkSuccess}</p> : null}

              <form data-testid="bug-status-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); updateBugStatus.mutate(); }}>
                <select data-testid="bug-status-item" value={selectedBugId} onChange={(e) => setSelectedBugId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>
                  {(bugsQuery.data ?? []).map((item: Bug) => <option key={item.id} value={item.id}>{item.title} ({item.status})</option>)}
                </select>
                <select data-testid="bug-status-value" value={bugStatus} onChange={(e) => setBugStatus(e.target.value as "OPEN" | "IN_PROGRESS" | "READY_FOR_QA" | "CLOSED")} className={`w-full rounded-xl border px-3 py-2 ${input}`}>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="READY_FOR_QA">READY_FOR_QA</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <button data-testid="bug-status-submit" type="submit" disabled={!selectedBugId} className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white md:col-span-2">Update Bug Status</button>
              </form>
              {bugStatusSuccess ? <p data-testid="bug-status-updated" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Updated bug: {bugStatusSuccess}</p> : null}

              <form data-testid="bug-assign-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); assignBug.mutate(); }}>
                <select data-testid="bug-assign-item" value={selectedBugId} onChange={(e) => setSelectedBugId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>
                  {(bugsQuery.data ?? []).map((item: Bug) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <select data-testid="bug-assign-developer" value={selectedDeveloperId} onChange={(e) => setSelectedDeveloperId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>
                  {(developersQuery.data ?? []).map((item: User) => <option key={item.id} value={item.id}>{item.email}</option>)}
                </select>
                <button data-testid="bug-assign-submit" type="submit" disabled={!selectedBugId || !selectedDeveloperId} className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white md:col-span-2">Assign Developer</button>
              </form>
              {bugAssigneeSuccess ? <p data-testid="bug-assigned-to" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Assigned to: {bugAssigneeSuccess}</p> : null}

              <form data-testid="bug-query-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); queryBugs.mutate(); }}>
                <input data-testid="bug-query-input" value={bugQuery} onChange={(e) => setBugQuery(e.target.value)} className={`w-full rounded-xl border px-3 py-2 md:col-span-2 ${input}`} />
                <button data-testid="bug-query-submit" type="submit" className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white md:col-span-2">Run Bug Query</button>
              </form>
              {bugQueryResults.length > 0 ? <p data-testid="bug-query-count" className="mt-3 text-sm">Query results: {bugQueryResults.length}</p> : null}
              <div data-testid="bug-query-results" className="mt-2 grid gap-2 md:grid-cols-2">
                {bugQueryResults.map((item) => (
                  <div key={item.id} className={`rounded-xl border p-2 text-sm ${input}`}>
                    {item.title} [{item.status}]
                  </div>
                ))}
              </div>
            </article>

            <article className={`rounded-2xl p-6 shadow-soft md:col-span-2 ${panel}`}>
              <h2 className="mb-4 text-lg font-semibold">Agile: Sprint + Kanban</h2>

              <form data-testid="agile-sprint-form" className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); createSprint.mutate(); }}>
                <input data-testid="agile-sprint-name" value={sprintName} onChange={(e) => setSprintName(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <input data-testid="agile-sprint-goal" value={sprintGoal} onChange={(e) => setSprintGoal(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <input data-testid="agile-sprint-start" type="date" value={sprintStartDate} onChange={(e) => setSprintStartDate(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <input data-testid="agile-sprint-end" type="date" value={sprintEndDate} onChange={(e) => setSprintEndDate(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <button data-testid="agile-sprint-submit" type="submit" disabled={!selectedProjectId} className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white md:col-span-2">Create Sprint</button>
              </form>
              {sprintSuccess ? <p data-testid="agile-sprint-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Created sprint id: {sprintSuccess}</p> : null}

              <form data-testid="agile-column-form" className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); setError(null); createBoardColumn.mutate(); }}>
                <input data-testid="agile-column-name" value={columnName} onChange={(e) => setColumnName(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <input data-testid="agile-column-position" type="number" min="0" value={columnPosition} onChange={(e) => setColumnPosition(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <input data-testid="agile-column-wip" type="number" min="1" value={columnWipLimit} onChange={(e) => setColumnWipLimit(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <button data-testid="agile-column-submit" type="submit" disabled={!selectedProjectId} className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white md:col-span-3">Create Kanban Column</button>
              </form>
              {columnSuccess ? <p data-testid="agile-column-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Created column id: {columnSuccess}</p> : null}

              <form data-testid="agile-move-form" className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); setError(null); moveBugOnBoard.mutate(); }}>
                <select data-testid="agile-move-bug" value={selectedBoardBugId} onChange={(e) => setSelectedBoardBugId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>
                  {(bugsQuery.data ?? []).map((item: Bug) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <select data-testid="agile-move-column" value={selectedBoardColumnId} onChange={(e) => setSelectedBoardColumnId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>
                  {(columnsQuery.data ?? []).map((item: BoardColumn) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <select data-testid="agile-move-sprint" value={selectedMoveSprintId} onChange={(e) => setSelectedMoveSprintId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>
                  <option value="">No sprint</option>
                  {(sprintsQuery.data ?? []).map((item: Sprint) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <button data-testid="agile-move-submit" type="submit" disabled={!selectedBoardBugId || !selectedBoardColumnId} className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white md:col-span-3">Move Bug to Column</button>
              </form>
              {boardMoveSuccess ? <p data-testid="agile-move-success" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Moved bug: {boardMoveSuccess}</p> : null}

              <div data-testid="agile-board" className="mt-4 grid gap-3 md:grid-cols-3">
                {(columnsQuery.data ?? []).map((column: BoardColumn) => {
                  const count = columnBugCounts.get(column.id) ?? 0;
                  const bugsInColumn = (bugsQuery.data ?? []).filter((bug) => bug.columnId === column.id);
                  const isWipExceeded = Boolean(column.wipLimit && count > column.wipLimit);

                  return (
                    <div key={column.id} className={`rounded-xl border p-3 ${input}`}>
                      <p className="text-sm font-semibold">{column.name}</p>
                      <p data-testid="agile-column-count" className="text-xs opacity-80">Cards: {count}{column.wipLimit ? ` / WIP ${column.wipLimit}` : ""}</p>
                      {isWipExceeded ? <p data-testid="agile-wip-warning" className="mt-2 text-xs text-ember">WIP warning: {column.name} exceeds limit</p> : null}
                      <div className="mt-2 grid gap-2">
                        {bugsInColumn.map((bug) => <div key={bug.id} data-testid="agile-card" className={`rounded-lg border px-2 py-1 text-xs ${input}`}>{bug.title}</div>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className={`rounded-2xl p-6 shadow-soft md:col-span-2 ${panel}`}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><TestTube2 size={18} className="text-pine" />Phase 2: Test Case and Run</h2>
              <form data-testid="test-case-form" className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); createCase.mutate(); }}>
                <select data-testid="test-case-project" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>{(projectsQuery.data ?? []).map((p: Project) => <option key={p.id} value={p.id}>{p.key} - {p.name}</option>)}</select>
                <input data-testid="test-case-title" placeholder="Test case title" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <textarea data-testid="test-case-steps" value={caseSteps} onChange={(e) => setCaseSteps(e.target.value)} className={`w-full rounded-xl border px-3 py-2 md:col-span-2 ${input}`} />
                <button data-testid="test-case-submit" type="submit" disabled={!selectedProject} className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white md:col-span-2">Create Test Case</button>
              </form>
              {caseSuccess ? <p data-testid="test-case-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Created test case id: {caseSuccess}</p> : null}

              <div data-testid="test-case-selection" className="mt-4 grid gap-2 md:grid-cols-2">
                {(testCasesQuery.data ?? []).map((item: TestCase) => (
                  <label key={item.id} className={`flex items-center gap-2 rounded-xl border p-2 ${input}`}>
                    <input data-testid={`test-case-checkbox-${item.id}`} type="checkbox" checked={selectedCaseIds.includes(item.id)} onChange={(e) => setSelectedCaseIds((prev) => e.target.checked ? Array.from(new Set([ ...prev, item.id ])) : prev.filter((x) => x !== item.id))} />
                    <span className="text-sm">{item.title}</span>
                  </label>
                ))}
              </div>

              <form data-testid="test-case-edit-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); updateCase.mutate(); }}>
                <select data-testid="test-case-edit-id" value={editCaseId} onChange={(e) => setEditCaseId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>
                  {(testCasesQuery.data ?? []).map((item: TestCase) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <input data-testid="test-case-edit-title" value={editCaseTitle} onChange={(e) => setEditCaseTitle(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <select data-testid="test-case-edit-status" value={editCaseStatus} onChange={(e) => setEditCaseStatus(e.target.value as "DRAFT" | "READY" | "DEPRECATED")} className={`w-full rounded-xl border px-3 py-2 ${input}`}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="DEPRECATED">DEPRECATED</option>
                </select>
                <button data-testid="test-case-edit-submit" type="submit" disabled={!editCaseId} className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white">Save Test Case</button>
              </form>
              {caseUpdateSuccess ? <p data-testid="test-case-updated-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Updated test case id: {caseUpdateSuccess}</p> : null}

              <form data-testid="test-run-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); createRun.mutate(); }}>
                <input data-testid="test-run-name" value={runName} onChange={(e) => setRunName(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <input data-testid="test-run-date" type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`} />
                <button data-testid="test-run-submit" type="submit" className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white md:col-span-2">Create Test Run</button>
              </form>
              {runSuccess ? <p data-testid="test-run-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Created test run id: {runSuccess}</p> : null}

              <form data-testid="test-execution-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); executeFail.mutate(); }}>
                <select data-testid="execution-run" value={selectedRunId} onChange={(e) => setSelectedRunId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>{(testRunsQuery.data ?? []).map((r: TestRun) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                <select data-testid="execution-case" value={selectedRunCaseId} onChange={(e) => setSelectedRunCaseId(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${input}`}>{runCases.map((r) => <option key={r.testCaseId} value={r.testCaseId}>{r.testCaseId.slice(0, 8)}...</option>)}</select>
                <button data-testid="execution-submit" type="submit" disabled={!selectedRunId || !selectedRunCaseId} className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white">Mark FAIL and Auto-create Bug</button>
                <button data-testid="execution-pass-submit" type="button" disabled={!selectedRunId || !selectedRunCaseId} onClick={() => { setError(null); executePass.mutate(); }} className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white">Mark PASS</button>
              </form>
              {execResultSuccess ? <p data-testid="execution-result" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Execution saved: {execResultSuccess}</p> : null}
              {execLinkedBugId ? <p data-testid="execution-linked-bug" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-pine" />Linked bug id: {execLinkedBugId}</p> : null}
            </article>
          </section>
        )}
      </div>
    </div>
  );
}
