const baseUrl = (process.env.API_BASE_URL || "http://127.0.0.1:4000/api").replace(
  /\/+$/,
  ""
);
const concurrency = Math.max(
  Number.parseInt(process.env.LOAD_CONCURRENCY || "10", 10),
  1
);
const rounds = Math.max(Number.parseInt(process.env.LOAD_ROUNDS || "3", 10), 1);

const scenarios = [
  { name: "notice feed", path: "/announcements", targetMs: 5000 },
  { name: "market search", path: "/products?query=guardora", targetMs: 3000 },
  { name: "safety map", path: "/areas", targetMs: 3000 },
  { name: "notification feed", path: "/notifications", targetMs: 3000 },
];

const percentile = (values, fraction) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(Math.ceil(sorted.length * fraction) - 1, sorted.length - 1)];
};

let failed = false;
for (const scenario of scenarios) {
  const timings = [];
  const statuses = [];
  for (let round = 0; round < rounds; round += 1) {
    const batch = await Promise.all(
      Array.from({ length: concurrency }, async () => {
        const started = performance.now();
        const response = await fetch(`${baseUrl}${scenario.path}`);
        await response.arrayBuffer();
        return {
          elapsed: performance.now() - started,
          status: response.status,
        };
      })
    );
    batch.forEach((result) => {
      timings.push(result.elapsed);
      statuses.push(result.status);
    });
  }
  const p50 = percentile(timings, 0.5);
  const p95 = percentile(timings, 0.95);
  const success = statuses.every((status) => status >= 200 && status < 300);
  const withinTarget = p95 <= scenario.targetMs;
  failed ||= !success || !withinTarget;
  console.log(
    `${scenario.name.padEnd(20)} p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms target=${scenario.targetMs}ms status=${success && withinTarget ? "PASS" : "FAIL"}`
  );
}

if (failed) process.exitCode = 1;
