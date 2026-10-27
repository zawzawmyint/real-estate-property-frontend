// Playwright-only fixture. No configurable upstream or non-loopback listener.
import { createHash, randomUUID } from "node:crypto";
import { createServer, request } from "node:http";

const upstream = "http://127.0.0.1:4311";
const rules = new Map();

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function matches(rule, incoming, url, body) {
  if (incoming.method !== rule.method || url.pathname !== rule.path)
    return false;
  if (
    rule.sessionDigest &&
    !incoming.headers.cookie?.split(";").some((cookie) => {
      const [name, ...value] = cookie.trim().split("=");
      return (
        name === "agency.session" &&
        createHash("sha256")
          .update(decodeURIComponent(value.join("=")))
          .digest("hex") === rule.sessionDigest
      );
    })
  )
    return false;
  if (
    rule.query &&
    Object.entries(rule.query).some(
      ([key, value]) => url.searchParams.get(key) !== value,
    )
  )
    return false;
  if (rule.title) {
    try {
      if (JSON.parse(body.toString()).title !== rule.title) return false;
    } catch {
      return false;
    }
  }

  if (rule.name) {
    try {
      if (JSON.parse(body.toString()).name !== rule.name) return false;
    } catch {
      return false;
    }
  }

  return true;
}

const server = createServer(async (incoming, response) => {
  try {
    const url = new URL(incoming.url, "http://127.0.0.1:4312");
    const chunks = [];
    let size = 0;

    for await (const chunk of incoming) {
      size += chunk.length;

      if (size > 7 * 1024 * 1024) {
        json(response, 413, { error: "Test fixture body limit exceeded" });
        return;
      }

      chunks.push(chunk);
    }

    const body = Buffer.concat(chunks);

    if (url.pathname === "/_e2e/health") {
      json(response, 200, { ready: true });
      return;
    }
    if (url.pathname === "/_e2e/rules" && incoming.method === "POST") {
      const rule = JSON.parse(body.toString());

      if (
        !["GET", "POST", "PATCH", "DELETE"].includes(rule.method) ||
        !(
          /^\/api\/v1\/staff\/properties(?:\/[\w-]+(?:\/photos)?)?$/.test(
            rule.path,
          ) ||
          (rule.method === "GET" && rule.path === "/api/v1/properties") ||
          (rule.method === "GET" &&
            rule.path === "/api/v1/auth/get-session" &&
            typeof rule.sessionDigest === "string" &&
            /^[a-f0-9]{64}$/.test(rule.sessionDigest)) ||
          /^\/api\/v1\/staff\/leads(?:\/[\w-]+(?:\/(?:notes|stage|assignment|activity))?)?$/.test(
            rule.path,
          ) ||
          /^\/api\/v1\/public\/properties\/[\w-]+\/inquiries$/.test(rule.path)
        ) ||
        (!(typeof rule.title === "string" && rule.title.length > 8) &&
          !(
            typeof rule.sessionDigest === "string" &&
            /^[a-f0-9]{64}$/.test(rule.sessionDigest)
          ) &&
          !(typeof rule.name === "string" && rule.name.length > 8) &&
          !(typeof rule.query?.q === "string" && rule.query.q.length > 8) &&
          !(
            typeof rule.query?.location === "string" &&
            rule.query.location.length > 8
          ) &&
          !(
            rule.path === "/api/v1/properties" &&
            rule.query?.featured === "true"
          )) ||
        (rule.status !== undefined && rule.status !== 503) ||
        (rule.query !== undefined &&
          (typeof rule.query !== "object" ||
            rule.query === null ||
            !Object.values(rule.query).every(
              (value) => typeof value === "string",
            )))
      ) {
        json(response, 400, {
          error:
            "An exact property request and unique title or search are required",
        });
        return;
      }

      const id = randomUUID();
      let release;
      const held = new Promise((resolve) => {
        release = resolve;
      });
      const timer = setTimeout(() => {
        release();
        rules.delete(id);
      }, 60_000);

      timer.unref();
      rules.set(id, { ...rule, hits: 0, held, release, timer });
      json(response, 201, { id });
      return;
    }
    if (url.pathname.startsWith("/_e2e/rules/")) {
      const [, , , id, operation] = url.pathname.split("/");
      const rule = rules.get(id);

      if (!rule) {
        json(response, 404, { error: "Unknown test rule" });
      } else if (incoming.method === "GET") {
        json(response, 200, { hits: rule.hits });
      } else if (incoming.method === "POST" && operation === "release") {
        rule.release();
        json(response, 200, { hits: rule.hits });
      } else if (incoming.method === "DELETE") {
        rule.release();
        clearTimeout(rule.timer);
        rules.delete(id);
        json(response, 200, { hits: rule.hits });
      } else {
        json(response, 405, { error: "Unsupported fixture operation" });
      }

      return;
    }
    if (url.pathname.startsWith("/_e2e")) {
      json(response, 404, { error: "Unknown fixture endpoint" });
      return;
    }

    for (const rule of rules.values()) {
      if (!matches(rule, incoming, url, body)) continue;

      rule.hits++;
      await rule.held;

      if (rule.status) {
        json(response, rule.status, {
          error: {
            code: "UNAVAILABLE",
            message: "Fixture service unavailable",
            requestId: "e2e-proxy",
          },
        });
        return;
      }

      break;
    }

    const forwarded = request(
      new URL(`${url.pathname}${url.search}`, upstream),
      {
        method: incoming.method,
        headers: { ...incoming.headers, host: "127.0.0.1:4311" },
      },
      (result) => {
        response.writeHead(result.statusCode ?? 502, result.headers);
        result.pipe(response);
      },
    );

    forwarded.on("error", () => {
      if (!response.headersSent)
        json(response, 502, { error: "Fixture upstream unavailable" });
      else response.destroy();
    });
    response.on("close", () => {
      if (!response.writableFinished) forwarded.destroy();
    });
    forwarded.end(body);
  } catch {
    if (!response.headersSent)
      json(response, 500, { error: "Invalid fixture request" });
    else response.destroy();
  }
});

server.listen(4312, "127.0.0.1", () => {
  console.log("Playwright backend proxy listening on 127.0.0.1:4312");
});
