import { CheckCircle2 } from "lucide-react";

type ProjectsPanelProps = {
  panelClass: string;
  sectionTitleClass: string;
  inputClass: string;
  buttonClass: string;
  projectName: string;
  projectKey: string;
  projectMethodology: "SCRUM" | "KANBAN";
  projectSuccess: string | null;
  onProjectNameChange: (value: string) => void;
  onProjectKeyChange: (value: string) => void;
  onProjectMethodologyChange: (value: "SCRUM" | "KANBAN") => void;
  onSubmit: () => void;
};

export function ProjectsPanel({
  panelClass,
  sectionTitleClass,
  inputClass,
  buttonClass,
  projectName,
  projectKey,
  projectMethodology,
  projectSuccess,
  onProjectNameChange,
  onProjectKeyChange,
  onProjectMethodologyChange,
  onSubmit
}: ProjectsPanelProps) {
  return (
    <article id="projects" className={panelClass}>
      <h2 className={sectionTitleClass}>Create Project</h2>
      <form
        data-testid="project-form"
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          data-testid="project-name"
          placeholder="Project name"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm ${inputClass}`}
        />
        <input
          data-testid="project-key"
          placeholder="Key"
          value={projectKey}
          onChange={(e) => onProjectKeyChange(e.target.value.toUpperCase())}
          className={`w-full rounded-lg border px-3 py-2 text-sm uppercase ${inputClass}`}
        />
        <select
          data-testid="project-methodology"
          value={projectMethodology}
          onChange={(e) => onProjectMethodologyChange(e.target.value as "SCRUM" | "KANBAN")}
          className={`w-full rounded-lg border px-3 py-2 text-sm ${inputClass}`}
        >
          <option value="SCRUM">SCRUM</option>
          <option value="KANBAN">KANBAN</option>
        </select>
        <button data-testid="project-submit" type="submit" className={buttonClass}>
          Create Project
        </button>
      </form>
      {projectSuccess ? (
        <p data-testid="project-created-key" className="mt-3 flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="text-[#1f883d]" />
          Created project key: {projectSuccess}
        </p>
      ) : null}
    </article>
  );
}
