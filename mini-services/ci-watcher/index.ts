// Continuous-improvement watcher.
// Runs every 15 minutes:
//   1. Health-checks the Next.js app at http://localhost:3000/
//   2. Runs `bun run lint` in the project root
//   3. Appends a single-line summary to /home/z/my-project/agent-ctx/ci-watch.log
//
// Designed to be started in the background alongside the dev server.
// Hot-reloaded by `bun --hot` on self-edit; the interval timer is reset on reload.
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const PROJECT_ROOT = "/home/z/my-project";
const LOG_FILE = `${PROJECT_ROOT}/agent-ctx/ci-watch.log`;
const HEALTH_URL = "http://localhost:3000/";
const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

mkdirSync(dirname(LOG_FILE), { recursive: true });

function ts(): string {
  return new Date().toISOString();
}

async function healthCheck(): Promise<{ ok: boolean; status: number; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(HEALTH_URL, { redirect: "manual" });
    return { ok: res.status >= 200 && res.status < 500, status: res.status, ms: Date.now() - start };
  } catch {
    return { ok: false, status: 0, ms: Date.now() - start };
  }
}

function runLint(): { ok: boolean; output: string } {
  try {
    const r = spawnSync("bun", ["run", "lint"], { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 120_000 });
    const out = (r.stdout || "") + (r.stderr || "");
    return { ok: r.status === 0, output: out.trim().slice(-400) };
  } catch (err) {
    return { ok: false, output: String(err) };
  }
}

async function tick(): Promise<void> {
  const health = await healthCheck();
  const lint = runLint();
  const line =
    `[${ts()}] health=${health.ok ? "OK" : "FAIL"}(${health.status},${health.ms}ms) ` +
    `lint=${lint.ok ? "OK" : "FAIL"}${lint.ok ? "" : ` :: ${lint.output.slice(0, 200)}`}\n`;
  appendFileSync(LOG_FILE, line);
}

async function main(): Promise<void> {
  appendFileSync(LOG_FILE, `[${ts()}] ci-watcher started (interval=${INTERVAL_MS}ms)\n`);
  // Run immediately so the first check is logged at startup.
  await tick();
  // Schedule recurring checks every 15 minutes.
  setInterval(() => { void tick(); }, INTERVAL_MS);
  process.on("SIGINT", () => {
    appendFileSync(LOG_FILE, `[${ts()}] ci-watcher stopped\n`);
    process.exit(0);
  });
}

void main();
