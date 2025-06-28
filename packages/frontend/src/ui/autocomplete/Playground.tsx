import React, { useState } from "react";

/**
 * Skeleton prototype of the Env‑Hopper 2.0 top‑level layout.
 * DaisyUI + Tailwind only; no real data wiring yet.
 */
export default function Playground() {
  /* ---- local demo state ---- */
  const envs = ["cross‑04", "preprod‑04", "g64‑int‑01"];
  const apps = ["Prod‑LIMS", "Kafka‑UI", "LIMS‑API"];
  const pages = [
    "Home",
    "View case #",
    "RM Support Review case #",
  ];

  const [env, setEnv] = useState(envs[0]);
  const [app, setApp] = useState(apps[0]);
  const [page, setPage] = useState(pages[0]);
  const [sub, setSub] = useState("");
  const [showCreds, setShowCreds] = useState(false);

  /* ---- helpers ---- */
  const validPath = page && (page.includes("#") ? sub.trim() : true);

  return (
    <div className="w-full font-sans">
      {/* ───────── Sticky header ───────── */}
      <header className="navbar bg-base-200 shadow-md sticky top-0 z-30 gap-2 px-4 h-16">
        {/* Env selector */}
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-sm btn-ghost normal-case">
            {env} ▾
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40"
          >
            {envs.map((e) => (
              <li key={e}>
                <button onClick={() => setEnv(e)}>{e}</button>
              </li>
            ))}
          </ul>
        </div>

        {/* App selector */}
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-sm btn-ghost normal-case">
            {app} ▾
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44"
          >
            {apps.map((a) => (
              <li key={a}>
                <button onClick={() => setApp(a)}>{a}</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Command bar bread‑crumb */}
        <div className="flex-1">
          <span className="opacity-60 mr-1">/</span>
          {page && (
            <span className="mr-1 badge badge-ghost cursor-pointer" onClick={() => setPage("")}>{page.replace(" #", "")}</span>
          )}
          {page.includes("#") && (
            <input
              type="text"
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              placeholder="Enter ID…"
              className="input input-sm input-bordered w-44 ml-1"
            />
          )}
          {!page && (
            <select
              className="select select-sm select-bordered w-40 ml-1"
              onChange={(e) => setPage(e.target.value)}
              defaultValue=""
            >
              <option disabled value="">
                Pick page…
              </option>
              {pages.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          )}
        </div>

        {/* Version badge */}
        <div className="badge badge-info badge-outline mr-2 cursor-pointer">
          v1.13.0
        </div>

        {/* Creds icon */}
        <button
          className="btn btn-circle btn-sm btn-ghost"
          onClick={() => setShowCreds(!showCreds)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>

        {/* Tools overflow */}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-sm btn-ghost">
            ⋯ Tools ▾
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 text-sm"
          >
            <li className="menu-title">
              <span>Environment</span>
            </li>
            <li>
              <a>Manage env</a>
            </li>
            <li>
              <a>AWS console</a>
            </li>
            <li className="menu-title">
              <span>Application</span>
            </li>
            <li>
              <a>Releases</a>
            </li>
            <li>
              <a>Config table</a>
            </li>
            <li className="menu-title">
              <span>App + Env</span>
            </li>
            <li>
              <a>DB creds</a>
            </li>
            <li>
              <a>Feature flags</a>
            </li>
          </ul>
        </div>
      </header>

      {/* ───────── Favorites rail (placeholder) ───────── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 bg-base-300 py-3 px-4 sticky top-16 z-20">
        {["cross‑04 / LIMS", "preprod‑04 / LIMS", "g64‑int‑01 / LIMS", "cross‑04 / Kafka‑UI", "cross‑04 / LIMS‑API", "⋯ More"].map((txt) => (
          <button key={txt} className="btn btn-xs btn-outline">
            {txt}
          </button>
        ))}
      </div>

      {/* ───────── Jump block ───────── */}
      <div className="px-4 py-6 space-y-4">
        <button className="btn btn-primary w-full md:w-60" disabled={!validPath}>
          Jump
        </button>

        {/* credentials panel */}
        {showCreds && (
          <div className="card bg-base-200 p-4 w-80 shadow-lg">
            <h2 className="font-semibold mb-2">Credentials</h2>
            {[
              {
                slug: "SC",
                desc: "San‑Carlos user",
                username: "testuser@natera.com",
                password: "testuser",
              },
              {
                slug: "AU",
                desc: "Austin user",
                username: "s_qalims_austin@natera.com",
                password: "Z*cTUz$2xM8X",
              },
              {
                slug: "qalims08",
                desc: "For scripts",
                username: "s_qalims08@natera.com",
                password: "az2DPv^M8Em3",
              },
            ].map((c) => (
              <div
                key={c.slug}
                className="flex items-center justify-between mb-2 text-sm"
              >
                <span className="mr-2 badge badge-ghost">{c.slug}</span>
                <span className="flex-1 truncate" title={c.desc}>
                  {c.desc}
                </span>
                <button
                  className="btn btn-xs btn-outline ml-1"
                  onClick={() => navigator.clipboard.writeText(c.username)}
                >
                  User
                </button>
                <button
                  className="btn btn-xs btn-outline ml-1"
                  onClick={() => navigator.clipboard.writeText(c.password)}
                >
                  Pwd
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
