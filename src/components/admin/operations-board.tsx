"use client";

import { useState } from "react";

type Job = { id: string; title: string; lane: "priority" | "packing" | "courier" | "failed" | "pickup" };
const seed: Job[] = [
  { id: "OP-001", title: "Scan packing for CL-0001 order", lane: "packing" },
  { id: "OP-002", title: "Assign courier south route", lane: "courier" },
  { id: "OP-003", title: "Failed delivery callback", lane: "failed" },
  { id: "OP-004", title: "Pickup ready notification", lane: "pickup" },
];
const lanes: Job["lane"][] = ["priority", "packing", "courier", "failed", "pickup"];

export function OperationsBoard() {
  const [jobs, setJobs] = useState(seed);
  const move = (id: string, lane: Job["lane"]) => setJobs((x) => x.map((j) => j.id === id ? { ...j, lane } : j));
  return <div className="grid gap-3 xl:grid-cols-5">{lanes.map((lane) => <section key={lane} className="border border-os-line bg-os-surface p-3"><p className="os-label mb-3 text-os-faint">{lane}</p><div className="space-y-3">{jobs.filter((j)=>j.lane===lane).map((j)=><article key={j.id} className="border border-os-line bg-os-surface-2 p-3"><p className="os-label text-os-faint">{j.id}</p><p className="mt-2 text-sm text-os-text">{j.title}</p><select value={j.lane} onChange={(e)=>move(j.id,e.target.value as Job["lane"])} className="mt-3 w-full bg-os-surface p-2 text-xs">{lanes.map((l)=><option key={l}>{l}</option>)}</select></article>)}</div></section>)}</div>;
}
