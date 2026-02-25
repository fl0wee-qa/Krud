export type SlackEvent = {
  type: "BUG_CREATED" | "BUG_UPDATED" | "TEST_FAILED";
  projectId?: string;
  message: string;
  payload?: Record<string, unknown>;
};

export interface SlackNotifier {
  notify(event: SlackEvent): Promise<void>;
}

export const SLACK_NOTIFIER = "SLACK_NOTIFIER";
