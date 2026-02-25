export type KrudRole = "ADMIN" | "QA" | "DEVELOPER" | "VIEWER";
export type Methodology = "SCRUM" | "KANBAN";

export type FeatureModules = {
  tests: boolean;
  bugs: boolean;
  specs: boolean;
  agile: boolean;
};
