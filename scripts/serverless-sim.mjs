import http from "node:http";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const proxyPort = Number(process.env.SERVERLESS_SIM_PORT || 3100);
const host = "127.0.0.1";
const idleTtlMs = Number(process.env.SERVERLESS_SIM_IDLE_TTL_MS || 5000);

let currentPort = 4100;
let activeServer = null;
let bootPromise = null;
let idleTimer = null;

function nextChildPort() {
  const port = currentPort;
  currentPort += 1;
  if (currentPort > 4999) currentPort = 4100;
  return port;
}

async function waitForServer(port, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request(
          {
            host,
            port,
            path: "/",
            method: "HEAD",
            timeout: 1000,
          },
          (res) => {
            res.resume();
            resolve();
          },
        );
        req.on("error", reject);
        req.on("timeout", () => req.destroy(new Error("timeout")));
        req.end();
      });
      return;
    } catch {
      await delay(150);
    }
  }

  throw new Error(`Timed out waiting for next server on port ${port}`);
}

async function bootServer() {
  const port = nextChildPort();
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "start", "--hostname", host, "--port", String(port)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        HOSTNAME: host,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[sim:child:${port}] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[sim:child:${port}] ${chunk}`);
  });

  await waitForServer(port);
  return { child, port };
}

function shutdownChild(child) {
  return new Promise((resolve) => {
    if (child.killed) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
    }, 3000);

    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });

    child.kill("SIGTERM");
  });
}

async function getOrBootServer() {
  if (activeServer) return activeServer;
  if (bootPromise) return bootPromise;

  bootPromise = bootServer()
    .then((server) => {
      activeServer = server;
      return server;
    })
    .finally(() => {
      bootPromise = null;
    });

  return bootPromise;
}

function scheduleShutdown() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    const server = activeServer;
    activeServer = null;
    idleTimer = null;
    if (server) {
      await shutdownChild(server.child);
      console.log(`[sim] idle shutdown for port ${server.port}`);
    }
  }, idleTtlMs);
}

const server = http.createServer(async (req, res) => {
  const startedAt = Date.now();

  try {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    const booted = await getOrBootServer();

    const upstream = http.request(
      {
        host,
        port: booted.port,
        method: req.method,
        path: req.url,
        headers: req.headers,
      },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode || 500, upstreamRes.headers);
        upstreamRes.pipe(res);
      },
    );

    upstream.on("error", (error) => {
      if (!res.headersSent) {
        res.statusCode = 502;
        res.setHeader("content-type", "text/plain; charset=utf-8");
      }
      res.end(`Upstream request failed: ${error.message}`);
    });

    req.pipe(upstream);

    await new Promise((resolve) => {
      res.on("finish", resolve);
      res.on("close", resolve);
    });
  } catch (error) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end(error instanceof Error ? error.message : "Unknown simulator error");
    }
  } finally {
    const duration = Date.now() - startedAt;
    console.log(`[sim] ${req.method} ${req.url} finished in ${duration}ms`);
    scheduleShutdown();
  }
});

server.listen(proxyPort, host, () => {
  console.log(`> Serverless simulator ready at http://${host}:${proxyPort}`);
  console.log(`> A fresh \`next start\` instance is booted on cold start, then reused for ${idleTtlMs}ms of idle time.`);
});
