"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Bug as BugIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  Link2,
  MoonStar,
  ScrollText,
  ShieldCheck,
  SunMedium,
  TestTube2,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { IntegrationsPanel } from "@/components/workbench/panels/integrations-panel";
import { ProjectsPanel } from "@/components/workbench/panels/projects-panel";
import { SessionPanel } from "@/components/workbench/panels/session-panel";
import { api, ApiError, AuthUser, BoardColumn, Bug, Project, Specification, Sprint, TestCase, TestRun, User } from "@/lib/api";
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
type WorkspaceSection = "overview" | "projects" | "bugs" | "agile" | "tests" | "specs" | "integrations";

type Phase1WorkbenchProps = {
  initialSection?: WorkspaceSection;
  focused?: boolean;
};

export function Phase1Workbench({ initialSection = "overview", focused = false }: Phase1WorkbenchProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

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
  const [specTitle, setSpecTitle] = useState("Authentication rules");
  const [specMarkdown, setSpecMarkdown] = useState("## Auth\n- User logs in with email/password\n- Access token required");
  const [selectedSpecId, setSelectedSpecId] = useState("");
  const [specUpdateMarkdown, setSpecUpdateMarkdown] = useState("## Auth v2\n- Add refresh flow and audit notes");

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
  const [specCreatedId, setSpecCreatedId] = useState<string | null>(null);
  const [specUpdatedId, setSpecUpdatedId] = useState<string | null>(null);

  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const collapsedSidebar = useUiStore((state) => state.collapsedSidebar);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("overview");
  const pathname = usePathname();
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
    setHydrated(true);
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

  useEffect(() => {
    setActiveSection(initialSection);
  }, [
    initialSection
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
  const specsQuery = useQuery({
    queryKey: [ "specs", token, selectedProjectId ],
    queryFn: () => api.listSpecs(token as string, selectedProjectId),
    enabled: Boolean(token && selectedProjectId)
  });
  const specCoverageQuery = useQuery({
    queryKey: [ "specs-coverage", token, selectedProjectId ],
    queryFn: () => api.getSpecCoverage(token as string, selectedProjectId),
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
    if (!specsQuery.data || specsQuery.data.length === 0) {
      setSelectedSpecId("");
      return;
    }
    const current = specsQuery.data.find((item) => item.id === selectedSpecId) ?? specsQuery.data[0];
    if (current.id !== selectedSpecId) {
      setSelectedSpecId(current.id);
    }
    setSpecUpdateMarkdown(current.markdown);
  }, [
    specsQuery.data,
    selectedSpecId
  ]);

  useEffect(() => {
    setBugQueryResults([]);
    setSelectedBoardColumnId("");
    setSelectedMoveSprintId("");
    setSelectedBoardBugId("");
    setSelectedSpecId("");
    setSpecCreatedId(null);
    setSpecUpdatedId(null);
  }, [
    selectedProjectId
  ]);

  const panel = theme === "light"
    ? "border border-slate-200/80 bg-white/90 text-slate-900 shadow-[0_22px_40px_-34px_rgba(15,23,42,0.7)] backdrop-blur-xl"
    : "border border-slate-700/60 bg-slate-900/70 text-slate-100 shadow-[0_30px_58px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl";
  const input = theme === "light"
    ? "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#1f883d] focus:outline-none focus:ring-2 focus:ring-[#1f883d]/20"
    : "border-slate-700 bg-slate-900/80 text-slate-100 placeholder:text-slate-400 focus:border-[#2ea043] focus:outline-none focus:ring-2 focus:ring-[#2ea043]/25";
  const primaryButton = "inline-flex items-center justify-center rounded-lg bg-[#1f883d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a7f37] disabled:cursor-not-allowed disabled:opacity-60";
  const ghostButton = theme === "light"
    ? "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-100"
    : "inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-slate-800";
  const sidebarToggleButton = theme === "light"
    ? "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
    : "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 transition hover:bg-slate-800";
  const statusBadge = theme === "light"
    ? "rounded-lg border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-700"
    : "rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200";
  const sectionTitle = "mb-4 text-base font-semibold tracking-tight md:text-lg";
  const navItems: Array<{ id: WorkspaceSection; label: string; icon: typeof LayoutDashboard; href: string }> = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard, href: "/" },
    { id: "projects" as const, label: "Projects", icon: FolderKanban, href: "/projects" },
    { id: "bugs" as const, label: "Bugs", icon: BugIcon, href: "/bugs" },
    { id: "agile" as const, label: "Agile", icon: GitBranch, href: "/agile" },
    { id: "tests" as const, label: "Testing", icon: TestTube2, href: "/tests" },
    { id: "specs" as const, label: "Specs", icon: ScrollText, href: "/specs" },
    { id: "integrations" as const, label: "Integrations", icon: Link2, href: "/integrations" }
  ];
  const endpointGroups = [
    { label: "Auth", endpoint: "POST /auth/login" },
    { label: "Projects", endpoint: "GET/POST /projects" },
    { label: "Bugs", endpoint: "GET/POST/PATCH /bugs" },
    { label: "Tests", endpoint: "POST /tests/cases, /tests/runs" },
    { label: "Agile", endpoint: "POST /agile/sprints, /agile/columns" },
    { label: "Specs", endpoint: "GET/POST/PATCH /specs" },
    { label: "Query", endpoint: "POST /query/bugs" }
  ];
  const sectionFromPath = ((): WorkspaceSection | null => {
    const routeMap: Record<string, WorkspaceSection> = {
      "/": "overview",
      "/projects": "projects",
      "/bugs": "bugs",
      "/agile": "agile",
      "/tests": "tests",
      "/specs": "specs",
      "/integrations": "integrations"
    };
    return routeMap[pathname] ?? null;
  })();
  const activeNavSection = sectionFromPath ?? activeSection;
  const focusMode = focused || Boolean(sectionFromPath && sectionFromPath !== "overview");
  const showSection = (section: WorkspaceSection) => !focusMode || activeNavSection === section;
  const sectionClass = (section: WorkspaceSection, base: string) => `${base} ${showSection(section) ? "" : "hidden"}`;

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (focusMode && !user) {
      window.location.href = "/";
    }
  }, [
    focusMode,
    hydrated,
    user
  ]);

  const navButton = (id: WorkspaceSection) => theme === "light"
    ? `inline-flex items-center rounded-lg border text-xs font-semibold uppercase tracking-wide transition ${
      collapsedSidebar ? "h-11 w-11 justify-center px-0 py-0" : "w-full justify-start gap-2 px-3 py-2"
    } ${
      activeNavSection === id
        ? "border-[#1f883d]/50 bg-[#1f883d]/10 text-[#1f883d]"
        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
    }`
    : `inline-flex items-center rounded-lg border text-xs font-semibold uppercase tracking-wide transition ${
      collapsedSidebar ? "h-11 w-11 justify-center px-0 py-0" : "w-full justify-start gap-2 px-3 py-2"
    } ${
      activeNavSection === id
        ? "border-[#2ea043]/60 bg-[#2ea043]/20 text-[#8ddb95]"
        : "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
    }`;
  const workspaceGridClass = collapsedSidebar
    ? "grid gap-4 md:grid-cols-[88px_1fr] md:gap-5"
    : "grid gap-4 md:grid-cols-[260px_1fr] md:gap-5";

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

  const createSpec = useMutation({
    mutationFn: async () => {
      if (!token || !selectedProjectId) {
        throw new Error("Select project");
      }
      const parsedTitle = z.string().min(3, "Spec title is required").max(160).safeParse(specTitle.trim());
      const parsedMarkdown = z.string().min(3, "Spec markdown is required").safeParse(specMarkdown.trim());
      if (!parsedTitle.success) {
        throw new Error(parsedTitle.error.issues[0]?.message ?? "Invalid spec title");
      }
      if (!parsedMarkdown.success) {
        throw new Error(parsedMarkdown.error.issues[0]?.message ?? "Invalid spec markdown");
      }
      return api.createSpec(token, {
        projectId: selectedProjectId,
        title: parsedTitle.data,
        markdown: parsedMarkdown.data
      });
    },
    onSuccess: async (spec) => {
      setSpecCreatedId(spec.id);
      await queryClient.invalidateQueries({ queryKey: [ "specs", token, selectedProjectId ] });
      await queryClient.invalidateQueries({ queryKey: [ "specs-coverage", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Spec creation failed")
  });

  const updateSpec = useMutation({
    mutationFn: async () => {
      if (!token || !selectedSpecId) {
        throw new Error("Select spec to update");
      }
      const parsedMarkdown = z.string().min(3, "Spec markdown is required").safeParse(specUpdateMarkdown.trim());
      if (!parsedMarkdown.success) {
        throw new Error(parsedMarkdown.error.issues[0]?.message ?? "Invalid spec markdown");
      }
      return api.updateSpec(token, selectedSpecId, {
        markdown: parsedMarkdown.data
      });
    },
    onSuccess: async (spec) => {
      setSpecUpdatedId(spec.id);
      await queryClient.invalidateQueries({ queryKey: [ "specs", token, selectedProjectId ] });
      await queryClient.invalidateQueries({ queryKey: [ "specs-coverage", token, selectedProjectId ] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Spec update failed")
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
    <div className="relative min-h-screen overflow-hidden px-4 py-6 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(31,136,61,0.15),transparent_38%),radial-gradient(circle_at_92%_10%,rgba(9,105,218,0.12),transparent_40%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className={workspaceGridClass}>
          <aside className={`rounded-2xl md:sticky md:top-6 md:h-[calc(100vh-3rem)] ${collapsedSidebar ? "p-3" : "p-4"} ${panel}`}>
            <div className={`${collapsedSidebar ? "mb-4 flex flex-col items-center gap-2" : "mb-4 flex items-center justify-between"}`}>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1f883d]">{collapsedSidebar ? "KR" : "KRUD NAV"}</p>
              <button type="button" onClick={toggleSidebar} className={sidebarToggleButton} aria-label={collapsedSidebar ? "Expand sidebar" : "Collapse sidebar"}>
                {collapsedSidebar ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>
            <div className={`${collapsedSidebar ? "grid justify-center gap-2" : "grid gap-2"}`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.id} href={item.href} className={navButton(item.id)} title={collapsedSidebar ? item.label : undefined} aria-label={item.label}>
                    <Icon size={14} />
                    {!collapsedSidebar ? item.label : null}
                  </a>
                );
              })}
            </div>

            {!collapsedSidebar ? (
              <div className="mt-6 space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-75">API Endpoints</p>
                {endpointGroups.map((item) => (
                  <div key={item.label} className={`rounded-lg border px-3 py-2 ${input}`}>
                    <p className="text-[11px] uppercase tracking-wider opacity-80">{item.label}</p>
                    <p className="font-mono text-xs">{item.endpoint}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </aside>

          <div className="space-y-4 md:space-y-5">
            <header id="overview" className={`rounded-2xl p-5 md:p-6 ${panel}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#1f883d]">KRUD // QAFlow Workbench</p>
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Auth, Projects, Bugs, Test Cases, Test Runs</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusBadge}>API: {healthQuery.data?.status ?? "checking..."}</span>
                    {selectedProject ? <span className={statusBadge}>Project: {selectedProject.key}</span> : null}
                    {user ? <span className={statusBadge}>Role: {user.role}</span> : null}
                    <span className={statusBadge}>
                      <UserRound size={12} className="inline-block" /> {user ? user.email : "Guest"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={toggleTheme} className={ghostButton}>
                    {theme === "dark" ? <SunMedium size={14} /> : <MoonStar size={14} />}
                    Theme
                  </button>
                  {user ? <button type="button" data-testid="logout-button" onClick={logout} className={ghostButton}>Logout</button> : null}
                </div>
              </div>
            </header>

            {error ? <div data-testid="form-error" className="flex items-center gap-2 rounded-2xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} className="text-red-300" /><p>{error}</p></div> : null}

        {!user ? (
          <section className={`rounded-2xl p-5 md:p-6 ${panel}`}>
            <h2 className={`${sectionTitle} flex items-center gap-2`}><ShieldCheck size={18} className="text-[#1f883d]" />Login</h2>
            <form data-testid="login-form" className="grid gap-3 md:max-w-md" onSubmit={(e) => { e.preventDefault(); setError(null); loginMutation.mutate(); }}>
              <input data-testid="login-email" type="email" placeholder="admin@krud.local" autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
              <input data-testid="login-password" type="password" placeholder="Your password" autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
              <button data-testid="login-submit" type="submit" className={primaryButton}>Login</button>
            </form>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 md:gap-5">
            <SessionPanel panelClass={`rounded-2xl p-5 md:p-6 ${panel}`} sectionTitleClass={sectionTitle} user={user} />

            <ProjectsPanel
              panelClass={sectionClass("projects", `rounded-2xl p-5 md:p-6 ${panel}`)}
              sectionTitleClass={sectionTitle}
              inputClass={input}
              buttonClass={primaryButton}
              projectName={projectName}
              projectKey={projectKey}
              projectMethodology={projectMethodology}
              projectSuccess={projectSuccess}
              onProjectNameChange={setProjectName}
              onProjectKeyChange={setProjectKey}
              onProjectMethodologyChange={setProjectMethodology}
              onSubmit={() => {
                setError(null);
                createProject.mutate();
              }}
            />

            <article id="bugs" className={sectionClass("bugs", `rounded-2xl p-5 md:p-6 md:col-span-2 ${panel}`)}>
              <h2 className={sectionTitle}>Create Bug</h2>
              <form data-testid="bug-form" className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); createBug.mutate(); }}>
                <select data-testid="bug-project" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>{(projectsQuery.data ?? []).map((p: Project) => <option key={p.id} value={p.id}>{p.key} - {p.name}</option>)}</select>
                <input data-testid="bug-title" placeholder="Bug title" value={bugTitle} onChange={(e) => setBugTitle(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <textarea data-testid="bug-description" placeholder="Description" value={bugDescription} onChange={(e) => setBugDescription(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm md:col-span-2 ${input}`} />
                <select data-testid="bug-linked-case" value={bugLinkedCaseId} onChange={(e) => setBugLinkedCaseId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm md:col-span-2 ${input}`}>
                  <option value="">No linked test case</option>
                  {(testCasesQuery.data ?? []).map((item: TestCase) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <select data-testid="bug-severity" value={bugSeverity} onChange={(e) => setBugSeverity(e.target.value as "S1" | "S2" | "S3" | "S4")} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}><option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option><option value="S4">S4</option></select>
                <select data-testid="bug-priority" value={bugPriority} onChange={(e) => setBugPriority(e.target.value as "P1" | "P2" | "P3" | "P4")} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option><option value="P4">P4</option></select>
                <button data-testid="bug-submit" type="submit" disabled={!selectedProject} className={`${primaryButton} md:col-span-2`}>Create Bug</button>
              </form>
              {bugSuccess ? <p data-testid="bug-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Created bug id: {bugSuccess}</p> : null}
              {bugLinkSuccess ? <p data-testid="bug-created-linked-case" className="mt-2 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Linked test case id: {bugLinkSuccess}</p> : null}

              <form data-testid="bug-status-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); updateBugStatus.mutate(); }}>
                <select data-testid="bug-status-item" value={selectedBugId} onChange={(e) => setSelectedBugId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  {(bugsQuery.data ?? []).map((item: Bug) => <option key={item.id} value={item.id}>{item.title} ({item.status})</option>)}
                </select>
                <select data-testid="bug-status-value" value={bugStatus} onChange={(e) => setBugStatus(e.target.value as "OPEN" | "IN_PROGRESS" | "READY_FOR_QA" | "CLOSED")} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="READY_FOR_QA">READY_FOR_QA</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <button data-testid="bug-status-submit" type="submit" disabled={!selectedBugId} className={`${primaryButton} md:col-span-2`}>Update Bug Status</button>
              </form>
              {bugStatusSuccess ? <p data-testid="bug-status-updated" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Updated bug: {bugStatusSuccess}</p> : null}

              <form data-testid="bug-assign-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); assignBug.mutate(); }}>
                <select data-testid="bug-assign-item" value={selectedBugId} onChange={(e) => setSelectedBugId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  {(bugsQuery.data ?? []).map((item: Bug) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <select data-testid="bug-assign-developer" value={selectedDeveloperId} onChange={(e) => setSelectedDeveloperId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  {(developersQuery.data ?? []).map((item: User) => <option key={item.id} value={item.id}>{item.email}</option>)}
                </select>
                <button data-testid="bug-assign-submit" type="submit" disabled={!selectedBugId || !selectedDeveloperId} className={`${primaryButton} md:col-span-2`}>Assign Developer</button>
              </form>
              {bugAssigneeSuccess ? <p data-testid="bug-assigned-to" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Assigned to: {bugAssigneeSuccess}</p> : null}

              <form data-testid="bug-query-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); queryBugs.mutate(); }}>
                <input data-testid="bug-query-input" value={bugQuery} onChange={(e) => setBugQuery(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm md:col-span-2 ${input}`} />
                <button data-testid="bug-query-submit" type="submit" className={`${primaryButton} md:col-span-2`}>Run Bug Query</button>
              </form>
              {bugQueryResults.length > 0 ? <p data-testid="bug-query-count" className="mt-3 text-sm">Query results: {bugQueryResults.length}</p> : null}
              <div data-testid="bug-query-results" className="mt-2 grid gap-2 md:grid-cols-2">
                {bugQueryResults.map((item) => (
                  <div key={item.id} className={`rounded-lg border p-2 text-sm ${input}`}>
                    {item.title} [{item.status}]
                  </div>
                ))}
              </div>
            </article>

            <article id="agile" className={sectionClass("agile", `rounded-2xl p-5 md:p-6 md:col-span-2 ${panel}`)}>
              <h2 className={`${sectionTitle} flex items-center gap-2`}><GitBranch size={18} className="text-[#1f883d]" />Agile: Sprint + Kanban</h2>

              <form data-testid="agile-sprint-form" className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); createSprint.mutate(); }}>
                <input data-testid="agile-sprint-name" value={sprintName} onChange={(e) => setSprintName(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <input data-testid="agile-sprint-goal" value={sprintGoal} onChange={(e) => setSprintGoal(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <input data-testid="agile-sprint-start" type="date" value={sprintStartDate} onChange={(e) => setSprintStartDate(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <input data-testid="agile-sprint-end" type="date" value={sprintEndDate} onChange={(e) => setSprintEndDate(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <button data-testid="agile-sprint-submit" type="submit" disabled={!selectedProjectId} className={`${primaryButton} md:col-span-2`}>Create Sprint</button>
              </form>
              {sprintSuccess ? <p data-testid="agile-sprint-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Created sprint id: {sprintSuccess}</p> : null}

              <form data-testid="agile-column-form" className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); setError(null); createBoardColumn.mutate(); }}>
                <input data-testid="agile-column-name" value={columnName} onChange={(e) => setColumnName(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <input data-testid="agile-column-position" type="number" min="0" value={columnPosition} onChange={(e) => setColumnPosition(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <input data-testid="agile-column-wip" type="number" min="1" value={columnWipLimit} onChange={(e) => setColumnWipLimit(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <button data-testid="agile-column-submit" type="submit" disabled={!selectedProjectId} className={`${primaryButton} md:col-span-3`}>Create Kanban Column</button>
              </form>
              {columnSuccess ? <p data-testid="agile-column-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Created column id: {columnSuccess}</p> : null}

              <form data-testid="agile-move-form" className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); setError(null); moveBugOnBoard.mutate(); }}>
                <select data-testid="agile-move-bug" value={selectedBoardBugId} onChange={(e) => setSelectedBoardBugId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  {(bugsQuery.data ?? []).map((item: Bug) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <select data-testid="agile-move-column" value={selectedBoardColumnId} onChange={(e) => setSelectedBoardColumnId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  {(columnsQuery.data ?? []).map((item: BoardColumn) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <select data-testid="agile-move-sprint" value={selectedMoveSprintId} onChange={(e) => setSelectedMoveSprintId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  <option value="">No sprint</option>
                  {(sprintsQuery.data ?? []).map((item: Sprint) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <button data-testid="agile-move-submit" type="submit" disabled={!selectedBoardBugId || !selectedBoardColumnId} className={`${primaryButton} md:col-span-3`}>Move Bug to Column</button>
              </form>
              {boardMoveSuccess ? <p data-testid="agile-move-success" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Moved bug: {boardMoveSuccess}</p> : null}

              <div data-testid="agile-board" className="mt-4 grid gap-3 md:grid-cols-3">
                {(columnsQuery.data ?? []).map((column: BoardColumn) => {
                  const count = columnBugCounts.get(column.id) ?? 0;
                  const bugsInColumn = (bugsQuery.data ?? []).filter((bug) => bug.columnId === column.id);
                  const isWipExceeded = Boolean(column.wipLimit && count > column.wipLimit);

                  return (
                    <div key={column.id} className={`rounded-lg border p-3 ${input}`}>
                      <p className="text-sm font-semibold">{column.name}</p>
                      <p data-testid="agile-column-count" className="text-xs opacity-80">Cards: {count}{column.wipLimit ? ` / WIP ${column.wipLimit}` : ""}</p>
                      {isWipExceeded ? <p data-testid="agile-wip-warning" className="mt-2 text-xs text-amber-500">WIP warning: {column.name} exceeds limit</p> : null}
                      <div className="mt-2 grid gap-2">
                        {bugsInColumn.map((bug) => <div key={bug.id} data-testid="agile-card" className={`rounded-lg border px-2 py-1 text-xs ${input}`}>{bug.title}</div>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article id="tests" className={sectionClass("tests", `rounded-2xl p-5 md:p-6 md:col-span-2 ${panel}`)}>
              <h2 className={`${sectionTitle} flex items-center gap-2`}><TestTube2 size={18} className="text-[#1f883d]" />Phase 2: Test Case and Run</h2>
              <form data-testid="test-case-form" className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); createCase.mutate(); }}>
                <select data-testid="test-case-project" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>{(projectsQuery.data ?? []).map((p: Project) => <option key={p.id} value={p.id}>{p.key} - {p.name}</option>)}</select>
                <input data-testid="test-case-title" placeholder="Test case title" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <textarea data-testid="test-case-steps" value={caseSteps} onChange={(e) => setCaseSteps(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm md:col-span-2 ${input}`} />
                <button data-testid="test-case-submit" type="submit" disabled={!selectedProject} className={`${primaryButton} md:col-span-2`}>Create Test Case</button>
              </form>
              {caseSuccess ? <p data-testid="test-case-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Created test case id: {caseSuccess}</p> : null}

              <div data-testid="test-case-selection" className="mt-4 grid gap-2 md:grid-cols-2">
                {(testCasesQuery.data ?? []).map((item: TestCase) => (
                  <label key={item.id} className={`flex items-center gap-2 rounded-lg border p-2 ${input}`}>
                    <input data-testid={`test-case-checkbox-${item.id}`} type="checkbox" checked={selectedCaseIds.includes(item.id)} onChange={(e) => setSelectedCaseIds((prev) => e.target.checked ? Array.from(new Set([ ...prev, item.id ])) : prev.filter((x) => x !== item.id))} />
                    <span className="text-sm">{item.title}</span>
                  </label>
                ))}
              </div>

              <form data-testid="test-case-edit-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); updateCase.mutate(); }}>
                <select data-testid="test-case-edit-id" value={editCaseId} onChange={(e) => setEditCaseId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  {(testCasesQuery.data ?? []).map((item: TestCase) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <input data-testid="test-case-edit-title" value={editCaseTitle} onChange={(e) => setEditCaseTitle(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <select data-testid="test-case-edit-status" value={editCaseStatus} onChange={(e) => setEditCaseStatus(e.target.value as "DRAFT" | "READY" | "DEPRECATED")} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="DEPRECATED">DEPRECATED</option>
                </select>
                <button data-testid="test-case-edit-submit" type="submit" disabled={!editCaseId} className={primaryButton}>Save Test Case</button>
              </form>
              {caseUpdateSuccess ? <p data-testid="test-case-updated-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Updated test case id: {caseUpdateSuccess}</p> : null}

              <form data-testid="test-run-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); createRun.mutate(); }}>
                <input data-testid="test-run-name" value={runName} onChange={(e) => setRunName(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <input data-testid="test-run-date" type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <button data-testid="test-run-submit" type="submit" className={`${primaryButton} md:col-span-2`}>Create Test Run</button>
              </form>
              {runSuccess ? <p data-testid="test-run-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Created test run id: {runSuccess}</p> : null}

              <form data-testid="test-execution-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); executeFail.mutate(); }}>
                <select data-testid="execution-run" value={selectedRunId} onChange={(e) => setSelectedRunId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>{(testRunsQuery.data ?? []).map((r: TestRun) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                <select data-testid="execution-case" value={selectedRunCaseId} onChange={(e) => setSelectedRunCaseId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>{runCases.map((r) => <option key={r.testCaseId} value={r.testCaseId}>{r.testCaseId.slice(0, 8)}...</option>)}</select>
                <button data-testid="execution-submit" type="submit" disabled={!selectedRunId || !selectedRunCaseId} className={primaryButton}>Mark FAIL and Auto-create Bug</button>
                <button data-testid="execution-pass-submit" type="button" disabled={!selectedRunId || !selectedRunCaseId} onClick={() => { setError(null); executePass.mutate(); }} className={primaryButton}>Mark PASS</button>
              </form>
              {execResultSuccess ? <p data-testid="execution-result" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Execution saved: {execResultSuccess}</p> : null}
              {execLinkedBugId ? <p data-testid="execution-linked-bug" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Linked bug id: {execLinkedBugId}</p> : null}
            </article>

            <article id="specs" className={sectionClass("specs", `rounded-2xl p-5 md:p-6 md:col-span-2 ${panel}`)}>
              <h2 className={`${sectionTitle} flex items-center gap-2`}><ScrollText size={18} className="text-[#1f883d]" />Specifications</h2>

              <form data-testid="spec-create-form" className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); createSpec.mutate(); }}>
                <input data-testid="spec-title" value={specTitle} onChange={(e) => setSpecTitle(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`} />
                <select data-testid="spec-project" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  {(projectsQuery.data ?? []).map((p: Project) => <option key={p.id} value={p.id}>{p.key} - {p.name}</option>)}
                </select>
                <textarea data-testid="spec-markdown" value={specMarkdown} onChange={(e) => setSpecMarkdown(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm md:col-span-2 ${input}`} rows={5} />
                <button data-testid="spec-submit" type="submit" disabled={!selectedProjectId} className={`${primaryButton} md:col-span-2`}>Create Spec</button>
              </form>
              {specCreatedId ? <p data-testid="spec-created-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Created spec id: {specCreatedId}</p> : null}

              <form data-testid="spec-update-form" className="mt-4 grid gap-3 border-t border-current/10 pt-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setError(null); updateSpec.mutate(); }}>
                <select data-testid="spec-update-id" value={selectedSpecId} onChange={(e) => setSelectedSpecId(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}>
                  {(specsQuery.data ?? []).map((item: Specification) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <button data-testid="spec-update-submit" type="submit" disabled={!selectedSpecId} className={primaryButton}>Save Spec Version</button>
                <textarea data-testid="spec-update-markdown" value={specUpdateMarkdown} onChange={(e) => setSpecUpdateMarkdown(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm md:col-span-2 ${input}`} rows={5} />
              </form>
              {specUpdatedId ? <p data-testid="spec-updated-id" className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-[#1f883d]" />Updated spec id: {specUpdatedId}</p> : null}

              <div data-testid="spec-coverage" className="mt-4 grid gap-2 md:grid-cols-3">
                <div className={`rounded-lg border p-3 ${input}`}><p className="text-xs uppercase opacity-75">Total Specs</p><p className="mt-1 text-lg font-semibold">{specCoverageQuery.data?.totalSpecs ?? 0}</p></div>
                <div className={`rounded-lg border p-3 ${input}`}><p className="text-xs uppercase opacity-75">Covered</p><p className="mt-1 text-lg font-semibold">{specCoverageQuery.data?.coveredSpecs ?? 0}</p></div>
                <div className={`rounded-lg border p-3 ${input}`}><p className="text-xs uppercase opacity-75">Uncovered</p><p className="mt-1 text-lg font-semibold">{specCoverageQuery.data?.uncoveredSpecs ?? 0}</p></div>
              </div>

              <div data-testid="spec-list" className="mt-4 grid gap-2 md:grid-cols-2">
                {(specsQuery.data ?? []).map((item) => (
                  <div key={item.id} className={`rounded-lg border p-3 ${input}`}>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs opacity-75">Latest version: {item.versions[0]?.version ?? 1}</p>
                  </div>
                ))}
              </div>
            </article>

            <IntegrationsPanel
              panelClass={sectionClass("integrations", `rounded-2xl p-5 md:p-6 md:col-span-2 ${panel}`)}
              sectionTitleClass={sectionTitle}
              inputClass={input}
              endpointGroups={endpointGroups}
            />
          </section>
        )}
        <footer className={`rounded-2xl p-4 ${panel}`}>
          <p className="text-xs opacity-80">Krud QAFlow - Portfolio First, SaaS Ready - Next.js + NestJS + Prisma + Playwright</p>
        </footer>
      </div>
    </div>
      </div>
    </div>
  );
}



