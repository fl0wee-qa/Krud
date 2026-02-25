import { AuthUser } from "@/lib/api";

type SessionPanelProps = {
  panelClass: string;
  sectionTitleClass: string;
  user: AuthUser;
};

export function SessionPanel({ panelClass, sectionTitleClass, user }: SessionPanelProps) {
  return (
    <article className={panelClass}>
      <h2 className={sectionTitleClass}>Session</h2>
      <p data-testid="auth-email-badge" className="rounded-lg border border-[#1f883d]/30 bg-[#1f883d]/10 px-3 py-2 text-sm font-medium text-[#1f883d]">
        {user.email} ({user.role})
      </p>
    </article>
  );
}
