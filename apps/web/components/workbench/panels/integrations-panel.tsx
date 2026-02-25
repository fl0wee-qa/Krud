import { Link2 } from "lucide-react";

type EndpointGroup = {
  label: string;
  endpoint: string;
};

type IntegrationsPanelProps = {
  panelClass: string;
  sectionTitleClass: string;
  inputClass: string;
  endpointGroups: EndpointGroup[];
};

export function IntegrationsPanel({
  panelClass,
  sectionTitleClass,
  inputClass,
  endpointGroups
}: IntegrationsPanelProps) {
  return (
    <article id="integrations" className={panelClass}>
      <h2 className={`${sectionTitleClass} flex items-center gap-2`}>
        <Link2 size={18} className="text-[#1f883d]" />
        Integrations & Endpoint Map
      </h2>
      <p className="text-sm opacity-85">
        You can already split UI flows by endpoint groups: Auth, Projects, Bugs, Tests, Agile, Query. These routes are
        already connected in the API client.
      </p>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {endpointGroups.map((item) => (
          <div key={`integrations-${item.label}`} className={`rounded-lg border p-3 ${inputClass}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{item.label}</p>
            <p className="mt-1 font-mono text-xs">{item.endpoint}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
