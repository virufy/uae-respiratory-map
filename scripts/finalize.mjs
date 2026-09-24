// Copies the single-file build output to a clearly named, double-clickable
// deliverable at the repo root so stakeholders can open it with no setup.
import { copyFileSync, existsSync } from "node:fs";

const src = "dist/index.html";
const out = "UAE-Respiratory-Surveillance-Dashboard.html";

if (!existsSync(src)) {
  console.error(`[finalize] expected ${src} — did vite build run?`);
  process.exit(1);
}
copyFileSync(src, out);
console.log(`[finalize] wrote self-contained deliverable → ${out}`);
