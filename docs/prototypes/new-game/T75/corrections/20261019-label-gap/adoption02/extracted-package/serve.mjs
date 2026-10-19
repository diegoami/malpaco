import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const portIndex = process.argv.indexOf("--port");
const port = portIndex === -1 ? 4175 : Number(process.argv[portIndex + 1]);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("port must be an integer from 1 to 65535");

const types = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"], [".svg", "image/svg+xml"],
  [".png", "image/png"], [".woff", "font/woff"], [".woff2", "font/woff2"],
]);

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (pathname.includes("\\") || pathname.includes("\0")) {
    response.writeHead(404).end();
    return;
  }
  const target = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    response.writeHead(404).end();
    return;
  }
  let info;
  try {
    info = await stat(target);
    if (!info.isFile()) throw new Error("not a file");
  } catch {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "content-type": types.get(extname(target).toLowerCase()) ?? "application/octet-stream",
    "content-length": info.size,
    "x-content-type-options": "nosniff",
    "cache-control": "no-cache",
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(target).pipe(response);
});

server.on("error", (error) => {
  console.error(`launcher error: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Malpaco is ready at http://127.0.0.1:${port}`);
});
