import React, { useState } from "react";
import {
  KeyRound,
  Copy,
  MoreHorizontal,
  ArrowUpRight,
  Plus,
  ChevronDown,
} from "lucide-react";

/**
 * Jump‑only prototype
 * – Quick‑Jump tiles (square 2×3)
 * – One‑liner control bar with split Jump / Tools
 * – Widget grid (Creds, Version, Add)
 */
export default function Playground() {
  /* demo data */
  const envs = ["cross-04", "preprod-04", "g64-int-01"];
  const apps = ["Prod-LIMS", "Kafka-UI", "LIMS-API"];
  const favorites: { env: string; app: string }[] = [
    { env: "cross-04", app: "Prod-LIMS" },
    { env: "preprod-04", app: "Prod-LIMS" },
    { env: "g64-int-01", app: "Prod-LIMS" },
    { env: "cross-04", app: "Kafka-UI" },
    { env: "cross-04", app: "LIMS-API" },
    { env: "⋯",       app: "More" },
  ];

  /* state */
  const [env, setEnv]   = useState(envs[0]);
  const [app, setApp]   = useState(apps[0]);
  const [path, setPath] = useState("");
  const [widgets]       = useState(["creds", "version"] as const); // future custom

  const valid = path.trim().length > 0;
  const envColor = (e: string) =>
    e.startsWith("cross")   ? "text-info"     :
      e.startsWith("preprod") ? "text-warning"  : "text-secondary";

  return (
    <div className="w-full flex justify-center font-sans p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* logo header */}
        <div className="flex items-center gap-4 mb-4">
          <span className="font-bold text-lg">Env‑Hopper</span>
          <span className="text-xs opacity-60">Jump</span>
        </div>

        {/* quick jump tiles */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {favorites.map(({ env: ev, app: ap }) => (
            <button
              key={`${ev}-${ap}`}
              className="btn btn-outline btn-sm h-20 flex flex-col justify-center items-center"
              onClick={() => {
                if (ap !== "More") {
                  setEnv(ev);
                  setApp(ap);
                }
              }}
            >
              <span className={`${envColor(ev)} font-medium leading-tight`}>{ev}</span>
              <span className="text-success/90 text-xs mt-1 leading-tight">{ap}</span>
            </button>
          ))}
        </div>

        {/* control bar with split button */}
        <div className="flex gap-2 items-center w-full">
          <Dropdown label={env} list={envs} onSelect={setEnv} />
          <Dropdown label={app} list={apps} onSelect={setApp} />

          <input
            className="input input-bordered flex-1"
            placeholder="/page / orderId …"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />

          {/* split button */}
          <div className="btn-group">
            <button className={`btn ${valid ? "btn-primary" : "btn-disabled"}`} disabled={!valid}>Jump</button>
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-primary btn-square" disabled={!valid}>
                <ChevronDown className="h-4 w-4" />
              </label>
              <ToolsMenu />
            </div>
          </div>
        </div>

        {/* widget grid below */}
        <WidgetGrid widgets={widgets} />
      </div>
    </div>
  );
}

/* widget grid + individual widgets */
function WidgetGrid({ widgets }: { widgets: readonly string[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {widgets.includes("creds")   && <CredsWidget />}
      {widgets.includes("version") && <VersionWidget />}
      <AddWidgetCard />
    </div>
  );
}

function CredsWidget() {
  const creds = [
    { slug: "SC", desc: "San‑Carlos", user: "test@natera.com",   pwd: "testuser" },
    { slug: "AU", desc: "Austin",      user: "austin@natera.com", pwd: "Z*cT"      },
  ];
  const copy = (t: string) => navigator.clipboard.writeText(t);
  return (
    <div className="card bg-base-100 shadow h-32 p-3">
      <h3 className="font-medium text-sm mb-2">Credentials</h3>
      {creds.map((c) => (
        <div key={c.slug} className="flex items-center justify-between text-xs mb-1">
          <span className="badge badge-ghost mr-1">{c.slug}</span>
          <span className="truncate flex-1" title={c.desc}>{c.desc}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => copy(c.user)} title="Copy user"><Copy className="h-3 w-3"/></button>
          <button className="btn btn-ghost btn-xs" onClick={() => copy(c.pwd)}  title="Copy pwd"><KeyRound className="h-3 w-3"/></button>
        </div>
      ))}
    </div>
  );
}

function VersionWidget() {
  const diffCommits = 2;   // stub
  const diffDays    = 5;   // stub
  return (
    <div className="card bg-base-100 shadow h-32 p-3 flex flex-col justify-between">
      <div>
        <h3 className="font-medium text-sm mb-2">Version</h3>
        <p className="text-lg font-semibold">v1.13.0</p>
      </div>
      <div className="text-xs opacity-70 flex items-center">
        <ArrowUpRight className="h-4 w-4 text-success mr-1"/>
        +{diffCommits} commits • {diffDays} days ahead of prod
      </div>
    </div>
  );
}

function AddWidgetCard() {
  return (
    <div className="border-2 border-dashed border-base-content/30 h-32 rounded flex flex-col items-center justify-center cursor-pointer text-base-content/40 hover:text-base-content/60">
      <Plus className="h-5 w-5 mb-1" />
      <span className="text-xs">Add widget…</span>
    </div>
  );
}

/* dropdown helpers */
function Dropdown({ label, list, onSelect }: { label: string; list: string[]; onSelect: (v: string) => void }) {
  return (
    <div className="dropdown">
      <label tabIndex={0} className="btn btn-ghost btn-sm normal-case">{label} ▾</label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44 text-sm">
        {list.map((item) => (<li key={item}><a onClick={() => onSelect(item)}>{item}</a></li>))}
      </ul>
    </div>
  );
}

function ToolsMenu() {
  return (
    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 text-xs">
      <li className="menu-title"><span>Environment</span></li>
      <li><a>Manage env</a></li>
      <li><a>AWS console</a></li>
      <li className="menu-title"><span>Application</span></li>
      <li><a>Releases</a></li>
      <li><a>Config table</a></li>
      <li className="menu-title"><span>App + Env</span></li>
      <li><a>DB credentials</a></li>
      <li><a>Feature flags</a></li>
    </ul>
  );
}
