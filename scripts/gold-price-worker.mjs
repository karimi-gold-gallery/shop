import "dotenv/config";

const intervalMs = 30_000;
const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.CRON_SECRET;
let stopped = false;

if (!secret) {
  throw new Error("CRON_SECRET is required");
}

async function synchronize() {
  const response = await fetch(`${appUrl}/api/gold-prices/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(20_000),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Sync failed (${response.status}): ${body}`);
  }

  console.log(`[${new Date().toISOString()}] Gold prices synchronized: ${body}`);
}

async function run() {
  while (!stopped) {
    try {
      await synchronize();
    } catch (error) {
      console.error(`[${new Date().toISOString()}]`, error);
    }

    if (!stopped) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

function stop() {
  stopped = true;
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

await run();
