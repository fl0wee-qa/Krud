import { APIRequestContext, expect, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@krud.local").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin12345!";

type LoginPayload = {
  accessToken: string;
};

type OutboundEvent = {
  type: string;
  status: string;
  payload?: {
    message?: string;
    marker?: string;
  };
};

async function getAdminToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });
  expect(response.ok(), "Admin user is missing. Run `npm run db:seed`.").toBeTruthy();
  const body = (await response.json()) as LoginPayload;
  return body.accessToken;
}

async function listEvents(request: APIRequestContext, token: string): Promise<OutboundEvent[]> {
  const response = await request.get(`${API_URL}/integrations/events`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as OutboundEvent[];
}

test("integration: slack mock notification queue", async ({ request }) => {
  const token = await getAdminToken(request);
  const marker = `slack-${Date.now()}`;
  const message = `Mock slack integration ${marker}`;

  const response = await request.post(`${API_URL}/integrations/slack/test`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      message
    }
  });
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual({
    queued: true
  });

  const events = await listEvents(request, token);
  const matched = events.find((item) => item.type === "SLACK_BUG_CREATED" && item.payload?.message === message);
  expect(matched).toBeTruthy();
  expect(matched?.status).toBe("QUEUED");
});

test("integration: git resolve uses link-only provider", async ({ request }) => {
  const token = await getAdminToken(request);
  const url = "https://github.com/example/repo/commit/abc123";

  const response = await request.post(`${API_URL}/integrations/git/resolve`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      url
    }
  });

  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual({
    url
  });
});

test("integration: git webhook mock is persisted as outbound event", async ({ request }) => {
  const token = await getAdminToken(request);
  const marker = `git-${Date.now()}`;
  const signature = process.env.GITHUB_WEBHOOK_SECRET;

  const response = await request.post(`${API_URL}/integrations/git/webhook`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(signature ? { "x-hub-signature-256": signature } : {})
    },
    data: {
      payload: {
        marker,
        commits: [
          {
            id: "abc123",
            message: "Fixes FLOW-123"
          }
        ]
      }
    }
  });

  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual({
    ok: true
  });

  const events = await listEvents(request, token);
  const matched = events.find((item) => item.type === "GIT_WEBHOOK_RECEIVED" && item.payload?.marker === marker);
  expect(matched).toBeTruthy();
  expect(matched?.status).toBe("QUEUED");
});
